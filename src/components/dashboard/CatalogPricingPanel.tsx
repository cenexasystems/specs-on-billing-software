import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { formatCurrency } from '../../lib/retail'
import { useProductStore, type Product } from '../../store/store'

type LensType = { id: number; name: string; description: string; is_active: boolean; sort_order: number }
type LensAddon = LensType & { price: number; pricing_type: 'fixed' | 'manual' }
type PriceRow = { id: number; product_id: number | null; product_name: string; price: number; offer_price: number | null; valid_from: string; valid_to: string | null }
type ProductForm = { name: string; price: string; description: string; lens_type_id: string; is_active: boolean }

const blankType = { name: '', description: '' }
const blankAddon = { name: '', description: '', price: '0', pricing_type: 'fixed' as 'fixed' | 'manual' }
const blankProduct: ProductForm = { name: '', price: '', description: '', lens_type_id: '', is_active: true }

export default function CatalogPricingPanel() {
  const { products, fetchProducts } = useProductStore()
  const [lensTypes, setLensTypes] = useState<LensType[]>([])
  const [addons, setAddons] = useState<LensAddon[]>([])
  const [history, setHistory] = useState<PriceRow[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [typeForm, setTypeForm] = useState(blankType)
  const [addonForm, setAddonForm] = useState(blankAddon)
  const [editingType, setEditingType] = useState<number | null>(null)
  const [editingAddon, setEditingAddon] = useState<number | null>(null)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>(blankProduct)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Zero-priced rows are incomplete catalog entries and should not appear in
  // pricing/lens management. Manual-price products remain available in POS.
  const catalogProducts = useMemo(() => products.filter(p => Number(p.price) > 0), [products])
  const lensProducts = useMemo(() => catalogProducts.filter(p => p.productType === 'lens'), [catalogProducts])
  const load = async () => {
    if (!isSupabaseConfigured) return
    setError('')
    const [types, addonRows, priceRows] = await Promise.all([
      supabase.from('lens_types').select('id,name,description,is_active,sort_order').order('sort_order'),
      supabase.from('lens_addons').select('id,name,description,price,pricing_type,is_active,sort_order').order('sort_order'),
      supabase.from('product_prices').select('id,product_id,product_name,price,offer_price,valid_from,valid_to').order('valid_from', { ascending: false }).limit(100),
    ])
    const firstError = types.error || addonRows.error || priceRows.error
    if (firstError) setError(firstError.message)
    setLensTypes((types.data || []) as LensType[])
    setAddons((addonRows.data || []) as LensAddon[])
    setHistory((priceRows.data || []) as PriceRow[])
  }
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
    // load is intentionally scoped to this one mount; refresh actions call it explicitly.
  }, [])

  const saveType = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('')
    if (!typeForm.name.trim()) return setError('Lens type name is required')
    const result = editingType
      ? await supabase.from('lens_types').update(typeForm).eq('id', editingType)
      : await supabase.from('lens_types').insert({ ...typeForm, is_active: true })
    if (result.error) return setError(result.error.message)
    setTypeForm(blankType); setEditingType(null); setNotice('Lens type saved'); await load()
  }
  const saveAddon = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('')
    if (!addonForm.name.trim()) return setError('Add-on name is required')
    const payload = { ...addonForm, price: Number(addonForm.price) || 0 }
    const result = editingAddon
      ? await supabase.from('lens_addons').update(payload).eq('id', editingAddon)
      : await supabase.from('lens_addons').insert({ ...payload, is_active: true })
    if (result.error) return setError(result.error.message)
    setAddonForm(blankAddon); setEditingAddon(null); setNotice('Lens add-on saved'); await load()
  }
  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('')
    if (!editingProduct) return setError('Select a product to edit')
    if (!productForm.name.trim()) return setError('Product name is required')
    const price = Number(productForm.price)
    if (!Number.isFinite(price) || price < 0) return setError('Enter a valid non-negative price')
    const result = await supabase.from('products').update({
      name: productForm.name.trim(),
      price,
      description: productForm.description.trim(),
      lens_type_id: productForm.lens_type_id ? Number(productForm.lens_type_id) : null,
      is_active: productForm.is_active,
    }).eq('id', editingProduct)
    if (result.error) return setError(result.error.message)
    setNotice('Product updated'); setEditingProduct(null); setProductForm(blankProduct)
    await Promise.all([load(), fetchProducts(true)])
  }
  const toggle = async (table: 'lens_types' | 'lens_addons', row: { id: number; is_active: boolean }) => {
    const result = await supabase.from(table).update({ is_active: !row.is_active }).eq('id', row.id)
    if (result.error) setError(result.error.message); else await load()
  }

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}" from the active catalog?`)) return
    setError(''); setNotice('')
    const result = await supabase.from('products').update({ is_active: false }).eq('id', product.id)
    if (result.error) return setError(result.error.message)
    setNotice('Product removed from the active catalog')
    await fetchProducts(true)
  }

  const visibleHistory = selectedProduct ? history.filter(row => String(row.product_id) === selectedProduct) : history

  return <section className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-[11px] font-black uppercase tracking-[.16em] text-maroon-dark">Catalog configuration</p><h2 className="text-2xl font-black text-[#111111]">Lens types & pricing history</h2><p className="mt-1 text-sm text-[#6B7280]">Products, prices, coupons, and categories remain editable in their existing dashboard tabs.</p></div>
      <button type="button" onClick={() => { void load(); void fetchProducts(true) }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-borderLight bg-white px-4 py-2.5 text-xs font-black"><RefreshCw size={15}/> Refresh</button>
    </div>
    {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{notice}</div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
    {!isSupabaseConfigured && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">Connect Supabase to edit catalog master data.</div>}

    <div className="rounded-2xl border border-borderLight bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-black">Catalog products</h3><p className="text-xs text-[#6B7280]">Edit the saved name, price, description, lens type, and visibility.</p></div><span className="rounded-full bg-[#fbf8f2] px-3 py-1 text-xs font-black">{catalogProducts.length}</span></div>
      {editingProduct && <form onSubmit={saveProduct} className="mb-5 grid gap-3 rounded-xl border border-[#e4d6c5]/60 bg-[#fbf8f2] p-4 sm:grid-cols-2">
        <input required value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="Product name" className="rounded-xl border border-borderLight bg-white px-3 py-2.5 text-sm font-bold outline-none" />
        <input required type="number" min="0" step="0.01" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} placeholder="Price" className="rounded-xl border border-borderLight bg-white px-3 py-2.5 text-sm font-bold outline-none" />
        <select value={productForm.lens_type_id} onChange={e => setProductForm(f => ({ ...f, lens_type_id: e.target.value }))} className="rounded-xl border border-borderLight bg-white px-3 py-2.5 text-sm font-bold outline-none"><option value="">No lens type</option>{lensTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select>
        <label className="flex items-center gap-2 rounded-xl border border-borderLight bg-white px-3 py-2.5 text-sm font-bold"><input type="checkbox" checked={productForm.is_active} onChange={e => setProductForm(f => ({ ...f, is_active: e.target.checked }))} /> Active</label>
        <textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="sm:col-span-2 rounded-xl border border-borderLight bg-white px-3 py-2.5 text-sm font-bold outline-none" />
        <div className="sm:col-span-2 flex gap-2"><button className="rounded-xl bg-maroon-dark px-4 py-2.5 text-xs font-black text-white"><Save size={14} className="mr-1 inline" />Save product</button><button type="button" onClick={() => { setEditingProduct(null); setProductForm(blankProduct) }} className="rounded-xl border border-borderLight bg-white px-4 py-2.5 text-xs font-black">Cancel</button></div>
      </form>}
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-borderLight text-[10px] uppercase tracking-wider text-[#6B7280]"><th className="px-3 py-2">Product</th><th className="px-3 py-2">Lens type</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Action</th></tr></thead><tbody>{catalogProducts.map(product => { const type = lensTypes.find(item => String(item.id) === String(product.lensTypeId)); return <tr key={String(product.id)} className="border-b border-borderLight/60"><td className="px-3 py-3"><p className="font-bold">{product.name}</p><p className="text-[#6B7280]">{product.description || 'No description'}</p></td><td className="px-3 py-3">{type?.name || '—'}</td><td className="px-3 py-3 font-black">{formatCurrency(product.price)}</td><td className="px-3 py-3"><span className={product.isActive ? 'font-black text-emerald-700' : 'font-black text-gray-500'}>{product.isActive ? 'Active' : 'Inactive'}</span></td><td className="px-3 py-3 text-right"><button type="button" onClick={() => { setEditingProduct(String(product.id)); setProductForm({ name: product.name, price: String(product.price), description: product.description || '', lens_type_id: product.lensTypeId ? String(product.lensTypeId) : '', is_active: product.isActive }) }} className="rounded-lg border border-borderLight px-3 py-2 font-black text-maroon-dark"><Pencil size={13} className="mr-1 inline" />Edit</button><button type="button" onClick={() => void deleteProduct(product)} className="ml-1 rounded-lg border border-red-200 px-3 py-2 font-black text-red-600 hover:bg-red-50"><Trash2 size={13} className="mr-1 inline" />Delete</button></td></tr> })}</tbody></table></div>
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-borderLight bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-black">Lens types</h3><p className="text-xs text-[#6B7280]">Non-branded, branded, or your own optical categories.</p></div><span className="rounded-full bg-[#fbf8f2] px-3 py-1 text-xs font-black">{lensTypes.length}</span></div>
        <form onSubmit={saveType} className="mb-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input required value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="Type name" className="rounded-xl border border-borderLight bg-[#fbf8f2] px-3 py-2.5 text-sm font-bold outline-none" />
          <input value={typeForm.description} onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="rounded-xl border border-borderLight bg-[#fbf8f2] px-3 py-2.5 text-sm font-bold outline-none" />
          <button className="rounded-xl bg-maroon-dark px-4 py-2.5 text-xs font-black text-white"><Save size={14} className="mr-1 inline" />{editingType ? 'Update' : 'Add'}</button>
        </form>
        <div className="space-y-2">{lensTypes.map(row => <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-borderLight p-3"><div className="min-w-0"><p className="truncate text-sm font-black">{row.name}</p><p className="truncate text-xs text-[#6B7280]">{row.description || 'No description'}</p></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => { setEditingType(row.id); setTypeForm({ name: row.name, description: row.description }) }} className="rounded-lg p-2 text-[#6B7280] hover:bg-[#fbf8f2]"><Pencil size={14}/></button><button type="button" onClick={() => void toggle('lens_types', row)} className={`rounded-lg px-2 py-1 text-[10px] font-black ${row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{row.is_active ? 'Active' : 'Inactive'}</button></div></div>)}</div>
      </div>

      <div className="rounded-2xl border border-borderLight bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-black">Lens add-ons</h3><p className="text-xs text-[#6B7280]">Coating, protection, tint, and other line-item charges.</p></div><span className="rounded-full bg-[#fbf8f2] px-3 py-1 text-xs font-black">{addons.length}</span></div>
        <form onSubmit={saveAddon} className="mb-5 grid gap-2 sm:grid-cols-2">
          <input required value={addonForm.name} onChange={e => setAddonForm(f => ({ ...f, name: e.target.value }))} placeholder="Add-on name" className="rounded-xl border border-borderLight bg-[#fbf8f2] px-3 py-2.5 text-sm font-bold outline-none" />
          <input value={addonForm.description} onChange={e => setAddonForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="rounded-xl border border-borderLight bg-[#fbf8f2] px-3 py-2.5 text-sm font-bold outline-none" />
          <input type="number" min="0" step="0.01" value={addonForm.price} onChange={e => setAddonForm(f => ({ ...f, price: e.target.value }))} placeholder="Price" className="rounded-xl border border-borderLight bg-[#fbf8f2] px-3 py-2.5 text-sm font-bold outline-none" />
          <div className="flex gap-2"><select value={addonForm.pricing_type} onChange={e => setAddonForm(f => ({ ...f, pricing_type: e.target.value as 'fixed' | 'manual' }))} className="min-w-0 flex-1 rounded-xl border border-borderLight bg-[#fbf8f2] px-3 py-2.5 text-sm font-bold"><option value="fixed">Fixed price</option><option value="manual">Manual price</option></select><button className="rounded-xl bg-maroon-dark px-4 py-2.5 text-xs font-black text-white"><Plus size={14} className="mr-1 inline" />{editingAddon ? 'Update' : 'Add'}</button></div>
        </form>
        <div className="space-y-2">{addons.map(row => <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-borderLight p-3"><div className="min-w-0"><p className="truncate text-sm font-black">{row.name} <span className="ml-1 text-xs text-maroon-dark">{row.pricing_type === 'manual' ? 'Manual' : formatCurrency(row.price)}</span></p><p className="truncate text-xs text-[#6B7280]">{row.description || 'No description'}</p></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => { setEditingAddon(row.id); setAddonForm({ name: row.name, description: row.description, price: String(row.price), pricing_type: row.pricing_type }) }} className="rounded-lg p-2 text-[#6B7280] hover:bg-[#fbf8f2]"><Pencil size={14}/></button><button type="button" onClick={() => void toggle('lens_addons', row)} className={`rounded-lg px-2 py-1 text-[10px] font-black ${row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{row.is_active ? 'Active' : 'Inactive'}</button></div></div>)}</div>
      </div>
    </div>

    <div className="rounded-2xl border border-borderLight bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-black">Product price history</h3><p className="text-xs text-[#6B7280]">Every product price change is recorded; invoices continue using their stored historical line prices.</p></div><select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="rounded-xl border border-borderLight bg-[#fbf8f2] px-3 py-2 text-xs font-bold"><option value="">All products</option>{lensProducts.map(p => <option key={String(p.id)} value={String(p.id)}>{p.name}</option>)}</select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b border-borderLight text-[10px] uppercase tracking-wider text-[#6B7280]"><th className="px-3 py-2">Product</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Offer</th><th className="px-3 py-2">Valid from</th><th className="px-3 py-2">Status</th></tr></thead><tbody>{visibleHistory.map(row => <tr key={row.id} className="border-b border-borderLight/60"><td className="px-3 py-3 font-bold">{row.product_name}</td><td className="px-3 py-3">{formatCurrency(row.price)}</td><td className="px-3 py-3">{row.offer_price == null ? '—' : formatCurrency(row.offer_price)}</td><td className="px-3 py-3">{new Date(row.valid_from).toLocaleString()}</td><td className="px-3 py-3 font-black">{row.valid_to ? 'Historical' : 'Current'}</td></tr>)}</tbody></table>{visibleHistory.length === 0 && <p className="py-8 text-center text-sm text-[#6B7280]">No price history yet. Product prices will be recorded after migration 0002 is applied.</p>}</div>
    </div>
  </section>
}

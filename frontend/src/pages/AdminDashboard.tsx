import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import './AdminDashboard.css';

const BACKEND = 'http://localhost:5001';

function getImage(images: any): string {
    const list = Array.isArray(images) ? images : (typeof images === 'string' ? JSON.parse(images || '[]') : []);
    if (!list.length) return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300';
    return list[0].startsWith('http') ? list[0] : `${BACKEND}${list[0]}`;
}

/* ---- Admin Analytics ---- */
function Analytics() {
    const [data, setData] = useState<any>(null);
    useEffect(() => { api.admin.getAnalytics().then(setData).catch(() => { }); }, []);
    if (!data) return <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />;
    return (
        <div>
            <h2 className="admin__section-title">Overview</h2>
            <div className="admin-analytics-grid">
                {[
                    { label: 'Total Users', value: data.totalUsers, icon: '👤' },
                    { label: 'Total Orders', value: data.totalOrders, icon: '📦' },
                    { label: 'Products', value: data.totalProducts, icon: '🛍' },
                    { label: 'Revenue', value: `₹${(+data.totalRevenue).toLocaleString('en-IN')}`, icon: '💰' },
                ].map(s => (
                    <div key={s.label} className="admin-stat-card">
                        <div className="admin-stat-card__icon">{s.icon}</div>
                        <div className="admin-stat-card__value">{s.value}</div>
                        <div className="admin-stat-card__label">{s.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ---- Image Cropper Modal ---- */
function CropperModal({ files, onComplete, onCancel }: { files: File[], onComplete: (croppedFiles: File[]) => void, onCancel: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [croppedFiles, setCroppedFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [aspect, setAspect] = useState<number>(1);
    const [imageAspect, setImageAspect] = useState<number>(1);

    useEffect(() => {
        const file = files[currentIndex];
        if (!file) return;

        let active = true;

        const loadFile = async () => {
            if (file.name.toLowerCase().match(/\.(heic|heif)$/)) {
                try {
                    setProcessing(true);
                    const heic2any = (await import('heic2any')).default;
                    const convertedBlob = await heic2any({
                        blob: file,
                        toType: "image/jpeg",
                        quality: 0.88
                    });
                    if (!active) return;
                    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

                    // Re-cast the converted blob as a File object so cropping logic works downstream
                    const jpegFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
                    const url = URL.createObjectURL(jpegFile);
                    setImageSrc(url);
                } catch (err) {
                    console.error("HEIC conversion failed on frontend", err);
                    if (!active) return;
                    const nextFiles = [...croppedFiles, file];
                    setCroppedFiles(nextFiles);
                    if (currentIndex < files.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                    } else {
                        onComplete(nextFiles);
                    }
                } finally {
                    if (active) setProcessing(false);
                }
            } else {
                const url = URL.createObjectURL(file);
                setImageSrc(url);
            }
        };

        loadFile();

        return () => { active = false; };
    }, [currentIndex, files, croppedFiles, onComplete]);

    const handleCropComplete = React.useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleNext = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setProcessing(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
            if (croppedBlob) {
                const newFiles = [...croppedFiles, croppedBlob];
                setCroppedFiles(newFiles);
                if (currentIndex < files.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    setAspect(1);
                    setImageSrc(null); // Reset before next image
                } else {
                    onComplete(newFiles);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    if (!imageSrc && !processing) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
            <div className="modal" style={{ width: 600, height: 600, display: 'flex', flexDirection: 'column' }}>
                <div className="modal__header">
                    <h2>Crop Image {currentIndex + 1} of {files.length}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onCancel}>✕</button>
                </div>
                <div className="modal__body" style={{ flex: 1, position: 'relative', background: '#333', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!imageSrc && processing && <div style={{ color: '#aaa', fontWeight: 500 }}>Converting HEIC format...</div>}
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={handleCropComplete}
                            onMediaLoaded={(media) => setImageAspect(media.width / media.height)}
                        />
                    )}
                </div>
                <div style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1, background: aspect === 1 ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: aspect === 1 ? '#fff' : '#aaa' }} onClick={() => { setAspect(1); setCrop({ x: 0, y: 0 }); }}>1:1 Square</button>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1, background: aspect === 4 / 5 ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: aspect === 4 / 5 ? '#fff' : '#aaa' }} onClick={() => { setAspect(4 / 5); setCrop({ x: 0, y: 0 }); }}>4:5 Portrait</button>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1, background: aspect === 16 / 9 ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: aspect === 16 / 9 ? '#fff' : '#aaa' }} onClick={() => { setAspect(16 / 9); setCrop({ x: 0, y: 0 }); }}>16:9 Land</button>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1, background: aspect === imageAspect && aspect !== 1 && aspect !== 4 / 5 && aspect !== 16 / 9 ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: aspect === imageAspect && aspect !== 1 && aspect !== 4 / 5 && aspect !== 16 / 9 ? '#fff' : '#aaa' }} onClick={() => { setAspect(imageAspect); setCrop({ x: 0, y: 0 }); setZoom(1); }}>Original</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            style={{ flex: 1 }}
                        />
                    </div>
                    <div className="modal__footer" style={{ borderTop: 'none', padding: 0 }}>
                        <button className="btn btn-ghost" onClick={onCancel} disabled={processing}>Cancel All</button>
                        <button className="btn btn-primary" onClick={handleNext} disabled={processing}>
                            {processing ? 'Processing...' : currentIndex < files.length - 1 ? 'Next Image ➜' : '✓ Finish & Upload'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---- Admin Products ---- */
function ProductForm({ initial, onSave, onClose }: { initial?: any, onSave: () => void, onClose: () => void }) {
    const [form, setForm] = useState({
        name: initial?.name || '',
        description: initial?.description || '',
        price: String(initial?.price || ''),

        materials: initial?.materials || '',
        categoryId: initial?.categoryId || '',
        images: Array.isArray(initial?.images) ? initial.images.join(',') : (typeof initial?.images === 'string' ? JSON.parse(initial.images || '[]').join(',') : ''),
        personalizationOptions: Array.isArray(initial?.personalizationOptions) ? initial.personalizationOptions.join(',') : '',
        tags: Array.isArray(initial?.tags) ? initial.tags.join(',') : '',
    });
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [filesToCrop, setFilesToCrop] = useState<File[] | null>(null);
    const [cropTargetIndex, setCropTargetIndex] = useState<number | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const { addToast } = useToast();

    useEffect(() => { api.getCategories().then(setCategories).catch(() => { }); }, []);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setFilesToCrop(Array.from(files));
    };

    const handleCropComplete = async (croppedFiles: File[]) => {
        setFilesToCrop(null);
        setUploading(true);
        try {
            const { urls } = await api.uploadImages(croppedFiles);
            if (cropTargetIndex !== null) {
                setForm(f => {
                    const currentImages = f.images.split(',').map((s: string) => s.trim()).filter(Boolean);
                    currentImages[cropTargetIndex] = urls[0];
                    return { ...f, images: currentImages.join(',') };
                });
                setCropTargetIndex(null);
            } else {
                setForm(f => ({ ...f, images: f.images ? f.images + ',' + urls.join(',') : urls.join(',') }));
            }
            addToast('Images cropped and uploaded! ✅', 'success');
        } catch { addToast('Upload failed', 'error'); }
        finally { setUploading(false); }
    };

    const handleEditImage = async (url: string, index: number) => {
        try {
            setUploading(true);
            const fullUrl = url.trim().startsWith('http') ? url.trim() : `${BACKEND}${url.trim()}`;
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            const file = new File([blob], `edit-image-${index}.jpg`, { type: blob.type || 'image/jpeg' });
            setCropTargetIndex(index);
            setFilesToCrop([file]);
        } catch (e) {
            console.error(e);
            addToast('Failed to load image for cropping', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...form,
                images: form.images.split(',').map((s: string) => s.trim()).filter(Boolean),
                personalizationOptions: form.personalizationOptions.split(',').map((s: string) => s.trim()).filter(Boolean),
                tags: form.tags.split(',').map((s: string) => s.trim()).filter(Boolean),
                categoryId: form.categoryId || undefined,
            };
            if (initial?.id) {
                await api.admin.updateProduct(initial.id, payload);
                addToast('Product updated!', 'success');
            } else {
                await api.admin.createProduct(payload);
                addToast('Product created!', 'success');
            }
            onSave();
        } catch (err: any) { addToast(err.message, 'error'); }
        finally { setLoading(false); }
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                    <div className="modal__header">
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem' }}>{initial ? 'Edit Product' : 'New Product'}</h2>
                        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal__body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {[
                                { label: 'Product Name', key: 'name', full: true },
                                { label: 'Price (₹)', key: 'price', type: 'number' },

                                { label: 'Materials', key: 'materials' },
                            ].map(f => (
                                <div key={f.key} className="form-group" style={f.full ? { gridColumn: '1/-1' } : {}}>
                                    <label className="form-label">{f.label}</label>
                                    <input type={f.type || 'text'} className="form-input" value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required={f.key === 'name' || f.key === 'price'} />
                                </div>
                            ))}
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Description</label>
                                <textarea className="form-input form-textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-input" value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}>
                                    <option value="">None</option>
                                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Personalization Options (comma separated)</label>
                                <input type="text" className="form-input" placeholder="engraved_name, gift_message, custom_image" value={form.personalizationOptions} onChange={e => setForm(p => ({ ...p, personalizationOptions: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Tags (comma separated)</label>
                                <input type="text" className="form-input" placeholder="handmade, bouquet, roses" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Upload Images (JPG, PNG, WebP, HEIC)</label>
                                <input type="file" multiple accept="image/*,.heic,.heif" onChange={handleImageSelect} className="form-input" />
                                {uploading && (
                                    <div className="alert-strip alert-strip--info" style={{ marginTop: 6 }}>⏳ Processing and uploading cropped images…</div>
                                )}
                                {!uploading && form.images && (
                                    <div className="alert-strip alert-strip--success" style={{ marginTop: 6 }}>✅ {form.images.split(',').filter(Boolean).length} image(s) ready</div>
                                )}
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Image URLs (comma separated, or add from upload above)</label>
                                <input type="text" className="form-input" value={form.images} onChange={e => setForm(p => ({ ...p, images: e.target.value }))} />
                                {/* Preview */}
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                    {form.images.split(',').map((s: string) => s.trim()).filter(Boolean).map((url: string, i: number) => {
                                        const fullUrl = url.startsWith('http') ? url : `${BACKEND}${url}`;
                                        return (
                                            <div key={i} style={{ position: 'relative' }}>
                                                <img
                                                    src={fullUrl}
                                                    alt="Thumbnail"
                                                    onClick={() => setPreviewImage(fullUrl)}
                                                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                                    title="Click to view full image"
                                                />
                                                <button
                                                    type="button"
                                                    title="Crop Image"
                                                    onClick={() => handleEditImage(url, i)}
                                                    style={{ position: 'absolute', top: -5, right: -5, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
                                                >
                                                    ✂️
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Product'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {filesToCrop && (
                <CropperModal
                    files={filesToCrop}
                    onComplete={handleCropComplete}
                    onCancel={() => { setFilesToCrop(null); setCropTargetIndex(null); }}
                />
            )}
            {previewImage && (
                <div className="modal-overlay" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.9)' }} onClick={() => setPreviewImage(null)}>
                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                        <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', color: 'white', zIndex: 1 }} onClick={() => setPreviewImage(null)}>✕ Close</button>
                        <img src={previewImage} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
                    </div>
                </div>
            )}
        </>
    );
}

function AdminProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const { addToast } = useToast();

    const load = () => {
        setLoading(true);
        api.admin.getProducts().then(setProducts).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await api.admin.deleteProduct(id);
            addToast('Product deleted', 'success');
            load();
        } catch { addToast('Delete failed', 'error'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 className="admin__section-title">Products</h2>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setFormOpen(true); }}>+ Add Product</button>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <img
                                            src={getImage(p.images)}
                                            alt={p.name}
                                            onClick={() => setPreviewImage(getImage(p.images))}
                                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8, background: 'var(--color-cream)', cursor: 'pointer' }}
                                            title="Click to view full image"
                                            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=100'; }}
                                        />
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                                    <td><span className="badge badge-primary">{p.category?.name || '—'}</span></td>
                                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{p.price.toLocaleString('en-IN')}</td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" style={{ marginRight: 6 }} onClick={() => { setEditing(p); setFormOpen(true); }}>Edit</button>
                                        <button className="btn btn-sm" style={{ background: 'rgba(192,57,43,0.1)', color: 'var(--color-error)', borderRadius: 'var(--radius-full)', border: 'none', padding: '6px 16px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleDelete(p.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {formOpen && <ProductForm initial={editing} onSave={() => { setFormOpen(false); load(); }} onClose={() => setFormOpen(false)} />}

            {previewImage && (
                <div className="modal-overlay" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.9)' }} onClick={() => setPreviewImage(null)}>
                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                        <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', color: 'white', zIndex: 1 }} onClick={() => setPreviewImage(null)}>✕ Close</button>
                        <img src={previewImage} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---- Product Preview Modal ---- */
function ProductPreviewModal({ product, onClose }: { product: any, onClose: () => void }) {
    const images = Array.isArray(product.images) ? product.images : (typeof product.images === 'string' ? JSON.parse(product.images || '[]') : []);
    const [activeIdx, setActiveIdx] = useState(0);

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 11000 }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, padding: 0, overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: 400, background: '#000' }}>
                    <img
                        src={images[activeIdx]?.startsWith('http') ? images[activeIdx] : `${BACKEND}${images[activeIdx]}`}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <button className="btn btn-ghost" style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, padding: 0 }} onClick={onClose}>✕</button>

                    {images.length > 1 && (
                        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
                            {images.map((_: any, i: number) => (
                                <div key={i} onClick={() => setActiveIdx(i)} style={{ width: 8, height: 8, borderRadius: '50%', background: i === activeIdx ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)' }} />
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 4 }}>{product.name}</h2>
                            <span className="badge badge-primary">{product.category?.name || 'Handmade'}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>₹{product.price.toLocaleString('en-IN')}</div>

                        </div>
                    </div>

                    <div style={{ background: 'var(--color-cream)', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)', marginBottom: 8 }}>Description</h4>
                        <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--color-text)' }}>{product.description}</p>
                    </div>

                    {product.materials && (
                        <div>
                            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)', marginBottom: 8 }}>Materials</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {product.materials.split(',').map((m: string) => (
                                    <span key={m} style={{ background: 'white', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', border: '1px solid var(--color-border)' }}>
                                        {m.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal__footer" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Close Preview</button>
                </div>
            </div>
        </div>
    );
}

/* ---- Admin Orders ---- */
function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectionModal, setRejectionModal] = useState<{ id: string, reason: string } | null>(null);
    const [previewProduct, setPreviewProduct] = useState<any>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [deliveryDates, setDeliveryDates] = useState<Record<string, string>>({});
    const { addToast } = useToast();

    useEffect(() => {
        api.admin.getOrders().then(setOrders).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const updateOrder = async (orderId: string, status: string, deliveryDate?: string, rejectionReason?: string) => {
        setUpdating(orderId);
        try {
            await api.admin.updateOrder(orderId, {
                status,
                deliveryDate: deliveryDate || deliveryDates[orderId] || undefined,
                rejectionReason
            });
            setOrders(p => p.map(o => o.id === orderId ? {
                ...o,
                status,
                deliveryDate: deliveryDate || deliveryDates[orderId] || o.deliveryDate,
                rejectionReason: status === 'REJECTED' ? rejectionReason : o.rejectionReason
            } : o));
            addToast(`Order ${status.toLowerCase()}!`, 'success');
            setRejectionModal(null);
        } catch { addToast('Update failed', 'error'); }
        finally { setUpdating(null); }
    };

    return (
        <div>
            <h2 className="admin__section-title">Orders</h2>
            {loading ? (
                <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
            ) : (
                <div className="admin-orders-list">
                    {orders.map(order => (
                        <div key={order.id} className="admin-order-card">
                            <div className="admin-order-card__header">
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>#{order.id.slice(0, 8).toUpperCase()}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                                    <div style={{ fontSize: '0.85rem', marginTop: 8 }}>
                                        <div style={{ fontWeight: 600 }}>{order.user.name}</div>
                                        <div style={{ color: 'var(--color-muted)' }}>{order.user.email}</div>
                                        {order.phoneNumber && (
                                            <div style={{ color: 'var(--color-primary)', marginTop: 2, fontWeight: 500 }}>
                                                📞 {order.phoneNumber}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.1rem' }}>₹{order.totalAmount.toLocaleString('en-IN')}</div>
                                    <span className={`badge badge-${order.status === 'DELIVERED' ? 'success' : order.status === 'REJECTED' ? 'error' : order.status === 'PLACED' ? 'warning' : 'info'}`}>
                                        {order.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="admin-order-card__items">
                                {order.orderItems.map((item: any) => (
                                    <div
                                        key={item.id}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-cream)', padding: '6px 12px', borderRadius: 12, cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onClick={() => setPreviewProduct(item.product)}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <img
                                            src={getImage(item.product.images)}
                                            alt={item.product.name}
                                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }}
                                        />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.product.name} ×{item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            {order.status === 'REJECTED' && order.rejectionReason && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-error)', background: 'rgba(192,57,43,0.05)', padding: '8px 12px', borderRadius: 8, marginBottom: 16 }}>
                                    <strong>Rejection Reason:</strong> {order.rejectionReason}
                                </div>
                            )}

                            <div className="admin-order-card__actions" style={{ opacity: order.status === 'REJECTED' ? 0.7 : 1 }}>
                                <select
                                    className="form-input select-status"
                                    style={{ maxWidth: 220, padding: '8px 40px 8px 14px', fontSize: '0.88rem' }}
                                    value={order.status}
                                    data-status={order.status}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val === 'REJECTED') {
                                            setRejectionModal({ id: order.id, reason: '' });
                                        } else {
                                            updateOrder(order.id, val);
                                        }
                                    }}
                                    disabled={updating === order.id || order.status === 'REJECTED'}
                                >
                                    <option value="PLACED">📝 Placed</option>
                                    <option value="ACCEPTED">✔️ Accepted</option>
                                    <option value="PREPARING">🎁 Preparing</option>
                                    <option value="OUT_FOR_DELIVERY">🚗 Out for Delivery</option>
                                    <option value="DELIVERED">🏠 Delivered</option>
                                    <option value="REJECTED" disabled>❌ Rejected (Locked)</option>
                                </select>
                                {order.status === 'PLACED' && (
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input
                                            type="date"
                                            className="form-input"
                                            style={{ maxWidth: 180, padding: '8px 12px' }}
                                            value={deliveryDates[order.id] || ''}
                                            onChange={e => setDeliveryDates(p => ({ ...p, [order.id]: e.target.value }))}
                                        />
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => updateOrder(order.id, 'ACCEPTED', deliveryDates[order.id])}
                                            disabled={updating === order.id || !deliveryDates[order.id]}
                                        >
                                            {updating === order.id ? 'Updating...' : '✓ Accept'}
                                        </button>
                                        <button
                                            className="btn btn-sm"
                                            style={{ background: 'rgba(192,57,43,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-full)', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                                            onClick={() => setRejectionModal({ id: order.id, reason: '' })}
                                            disabled={updating === order.id}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {rejectionModal && (
                <div className="modal-overlay" onClick={() => setRejectionModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal__header">
                            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>Reject Order</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setRejectionModal(null)}>✕</button>
                        </div>
                        <div className="modal__body">
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 16 }}>
                                Please provide a reason for rejecting this order. This will be sent to the customer.
                            </p>
                            <div className="form-group">
                                <label className="form-label">Reason for Rejection</label>
                                <textarea
                                    className="form-input"
                                    style={{ height: 100, padding: 12 }}
                                    placeholder="e.g., Insufficient materials, delivery area not covered..."
                                    value={rejectionModal.reason}
                                    onChange={e => setRejectionModal(p => p ? { ...p, reason: e.target.value } : null)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn-ghost" onClick={() => setRejectionModal(null)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                style={{ background: 'var(--color-error)' }}
                                onClick={() => updateOrder(rejectionModal.id, 'REJECTED', undefined, rejectionModal.reason)}
                                disabled={updating === rejectionModal.id || !rejectionModal.reason.trim()}
                            >
                                {updating === rejectionModal.id ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewProduct && <ProductPreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} />}
        </div>
    );
}

/* ---- Admin Users ---- */
function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { api.admin.getUsers().then(setUsers).catch(() => { }).finally(() => setLoading(false)); }, []);
    return (
        <div>
            <h2 className="admin__section-title">Users</h2>
            {loading ? <div className="skeleton" style={{ height: 200, borderRadius: 12 }} /> : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Orders</th><th>Joined</th></tr></thead>
                        <tbody>
                            {users.map((u: any) => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                                    <td style={{ color: 'var(--color-muted)' }}>{u.email}</td>
                                    <td><span className={`badge badge-${u.role === 'ADMIN' ? 'primary' : 'success'}`}>{u.role}</span></td>
                                    <td>{u._count?.orders ?? 0}</td>
                                    <td style={{ fontSize: '0.83rem', color: 'var(--color-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ---- Main Dashboard ---- */
export default function AdminDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/admin', label: 'Analytics', icon: '📊' },
        { path: '/admin/products', label: 'Products', icon: '🛍' },
        { path: '/admin/orders', label: 'Orders', icon: '📦' },
        { path: '/admin/users', label: 'Users', icon: '👤' },
    ];

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="admin-dashboard">
            {/* Mobile Header */}
            <header className="admin-mobile-header">
                <div className="admin-mobile-header__inner">
                    <img src="/519350388_17845389072528262_7307843047216242767_n.jpg" alt="Logo" style={{ height: 32, width: 'auto', borderRadius: 4 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Admin</span>
                    <button
                        className={`admin-hamburger ${mobileMenuOpen ? 'open' : ''}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="admin-sidebar__logo">
                    <img src="/519350388_17845389072528262_7307843047216242767_n.jpg" alt="Logo" style={{ height: 40, width: 'auto', borderRadius: 6, marginBottom: 8 }} />
                    <span>Whiff & Wrap</span>
                    <div className="label-text" style={{ marginTop: 2, color: 'rgba(255,255,255,0.6)' }}>Admin</div>
                </div>
                <nav className="admin-sidebar__nav">
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            className={`admin-sidebar__link ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div style={{ padding: '0 var(--space-4)', marginTop: '20px' }}>
                    <Link to="/" className="admin-sidebar__link">
                        <span>←</span>
                        <span>Back to Store</span>
                    </Link>
                </div>
            </aside>

            {/* Main */}
            <main className="admin-main">
                <Routes>
                    <Route path="/" element={<Analytics />} />
                    <Route path="/products" element={<AdminProducts />} />
                    <Route path="/orders" element={<AdminOrders />} />
                    <Route path="/users" element={<AdminUsers />} />
                </Routes>
            </main>
        </div>
    );
}

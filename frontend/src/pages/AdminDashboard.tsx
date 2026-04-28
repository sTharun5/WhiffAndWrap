import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import Select from '../components/Select';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import {
    FiShoppingBag, FiClock, FiScissors, FiUploadCloud, FiCheck, FiFileText, FiArrowRight, FiX, FiPlus, FiUser, FiPlay, FiZap, FiArrowLeft, FiPackage, FiMessageSquare
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getImage(images: any): string {
    const list = Array.isArray(images) ? images : (typeof images === 'string' ? JSON.parse(images || '[]') : []);
    if (!list.length) return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300';
    return list[0].startsWith('http') ? list[0] : `${BACKEND}${list[0]}`;
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
                    <button className="btn btn-ghost btn-sm" onClick={onCancel}><FiX /></button>
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
                        <button className="btn btn-primary" onClick={handleNext} disabled={processing} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {processing ? 'Processing...' : currentIndex < files.length - 1 ? <>{currentIndex + 1 < files.length ? 'Next Image' : 'Finish'} <FiArrowRight /></> : <><FiCheck /> Finish & Upload</>}
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
        isAvailable: initial?.isAvailable !== undefined ? initial.isAvailable : true,
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
            addToast('Images cropped and uploaded!', 'success');
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
                        <button className="btn btn-ghost btn-sm" onClick={onClose}><FiX /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal__body admin-form-grid">
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
                                <Select
                                    value={form.categoryId || ''}
                                    onChange={val => setForm(p => ({ ...p, categoryId: val }))}
                                    options={[
                                        { label: 'None', value: '' },
                                        ...categories.map((c: any) => ({ label: c.name, value: c.id }))
                                    ]}
                                    searchable
                                    placeholder="Select a category"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Personalization Options (comma separated)</label>
                                <input type="text" className="form-input" placeholder="engraved_name, gift_message, custom_image" value={form.personalizationOptions} onChange={e => setForm(p => ({ ...p, personalizationOptions: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Tags (comma separated)</label>
                                <input type="text" className="form-input" placeholder="handmade, bouquet, roses" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-cream)', padding: '12px 16px', borderRadius: 12 }}>
                                <input
                                    type="checkbox"
                                    id="isAvailable"
                                    checked={form.isAvailable}
                                    onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))}
                                    style={{ width: 20, height: 20, cursor: 'pointer' }}
                                />
                                <label htmlFor="isAvailable" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 600 }}>
                                    Product is Available for Order
                                </label>
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Upload Images (JPG, PNG, WebP, HEIC)</label>
                                <input type="file" multiple accept="image/*,.heic,.heif" onChange={handleImageSelect} className="form-input" />
                                {uploading && (
                                    <div className="alert-strip alert-strip--info" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FiClock /> Processing and uploading cropped images…
                                    </div>
                                )}
                                {!uploading && form.images && (
                                    <div className="alert-strip alert-strip--success" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FiCheck /> {form.images.split(',').filter(Boolean).length} image(s) ready
                                    </div>
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
                                                    <FiScissors />
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
    const { confirm } = useConfirm();

    const load = () => {
        setLoading(true);
        api.admin.getProducts().then(setProducts).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleDelete = async (id: string) => {
        if (!(await confirm({
            title: 'Delete Product',
            message: 'This action cannot be undone. Are you sure you want to delete this product?',
            confirmText: 'Delete',
            danger: true
        }))) return;
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
                <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setFormOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiPlus /> Add Product
                </button>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td className="admin-td-img">
                                        <img
                                            src={getImage(p.images)}
                                            alt={p.name}
                                            onClick={() => setPreviewImage(getImage(p.images))}
                                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8, background: 'var(--color-cream)', cursor: 'pointer' }}
                                            title="Click to view full image"
                                            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=100'; }}
                                        />
                                    </td>
                                    <td data-label="Name" style={{ fontWeight: 600 }}>{p.name}</td>
                                    <td data-label="Category"><span className="badge badge-primary">{p.category?.name || '—'}</span></td>
                                    <td data-label="Price" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{p.price.toLocaleString('en-IN')}</td>
                                    <td data-label="Status">
                                        <span className={`badge badge-${p.isAvailable ? 'success' : 'error'}`}>
                                            {p.isAvailable ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td data-label="Actions">
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



/* ---- Admin Users ---- */
function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const { confirm } = useConfirm();
    const { user } = useAuth();

    const load = () => {
        setLoading(true);
        api.admin.getUsers().then(setUsers).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleMakeAdmin = async (id: string, name: string) => {
        if (!(await confirm({
            title: 'Make Admin',
            message: `Are you sure you want to grant admin privileges to ${name}? They will have full access to manage products, orders, and other users.`,
            confirmText: 'Make Admin',
            danger: true
        }))) return;

        try {
            await api.admin.updateUserRole(id, 'ADMIN');
            addToast(`${name} is now an admin!`, 'success');
            load();
        } catch { addToast('Failed to change role', 'error'); }
    };

    const handleRemoveAdmin = async (id: string, name: string) => {
        if (!(await confirm({
            title: 'Remove Admin Privileges',
            message: `Are you sure you want to revoke admin privileges from ${name}? They will become a standard user.`,
            confirmText: 'Remove Admin',
            danger: true
        }))) return;

        try {
            await api.admin.updateUserRole(id, 'USER');
            addToast(`${name} is now a standard user`, 'success');
            load();
        } catch { addToast('Failed to change role', 'error'); }
    };

    return (
        <div>
            <h2 className="admin__section-title">Users</h2>
            {loading ? <div className="skeleton" style={{ height: 200, borderRadius: 12 }} /> : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Orders</th><th>Joined</th><th>Actions</th></tr></thead>
                        <tbody>
                            {users.map((u: any) => (
                                <tr key={u.id}>
                                    <td data-label="Name" style={{ fontWeight: 600 }}>{u.name}</td>
                                    <td data-label="Email" style={{ color: 'var(--color-muted)' }}>{u.email}</td>
                                    <td data-label="Role"><span className={`badge badge-${u.role === 'ADMIN' ? 'primary' : 'success'}`}>{u.role}</span></td>
                                    <td data-label="Orders">{u._count?.orders ?? 0}</td>
                                    <td data-label="Joined" style={{ fontSize: '0.83rem', color: 'var(--color-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td data-label="Actions">
                                        {u.role !== 'ADMIN' && (
                                            <button className="btn btn-sm" style={{ background: 'rgba(41, 128, 185, 0.1)', color: 'var(--color-info)', borderRadius: 'var(--radius-full)', border: 'none', padding: '6px 16px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleMakeAdmin(u.id, u.name)}>Make Admin</button>
                                        )}
                                        {u.role === 'ADMIN' && user?.id !== u.id && (
                                            <button className="btn btn-sm" style={{ background: 'rgba(192, 57, 43, 0.1)', color: 'var(--color-error)', borderRadius: 'var(--radius-full)', border: 'none', padding: '6px 16px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleRemoveAdmin(u.id, u.name)}>Remove Admin</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ---- Admin Orders ---- */
function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const { addToast } = useToast();

    const STATUS_OPTIONS = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED'];
    const STATUS_COLOR: Record<string, string> = {
        PLACED: 'var(--color-info)', ACCEPTED: 'var(--color-success)', PREPARING: 'var(--color-warning)',
        OUT_FOR_DELIVERY: 'var(--color-warning)', DELIVERED: 'var(--color-success)', REJECTED: 'var(--color-error)'
    };

    const load = () => {
        setLoading(true);
        api.admin.getOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleStatusChange = async (id: string, status: string, deliveryDate?: string, rejectionReason?: string) => {
        setUpdating(id);
        try {
            await api.admin.updateOrder(id, { status, deliveryDate, rejectionReason });
            addToast('Order updated!', 'success');
            load();
        } catch { addToast('Update failed', 'error'); }
        finally { setUpdating(null); }
    };

    return (
        <div>
            <h2 className="admin__section-title">Orders</h2>
            {loading ? <div className="skeleton" style={{ height: 300, borderRadius: 12 }} /> : orders.length === 0 ? (
                <div className="empty-state">No orders yet.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {orders.map(order => (
                        <div key={order.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 8 }}>
                                <div>
                                    <p style={{ fontWeight: 700, fontFamily: 'monospace' }}>#{order.id.slice(0, 8).toUpperCase()}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{order.user?.name} · {order.user?.email}</p>
                                    {order.phoneNumber && <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>📞 {order.phoneNumber}</p>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 'var(--radius-full)', background: `${STATUS_COLOR[order.status] || '#888'}18`, color: STATUS_COLOR[order.status] || '#888', fontWeight: 700, fontSize: '0.75rem' }}>
                                        {order.status.replace(/_/g, ' ')}
                                    </span>
                                    <p style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1rem' }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</p>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div style={{ padding: '12px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
                                    <label className="form-label">Update Status</label>
                                    <select className="form-input" defaultValue={order.status} disabled={updating === order.id}
                                        onChange={e => {
                                            const s = e.target.value;
                                            if (s === 'ACCEPTED') {
                                                const d = prompt('Enter delivery date (YYYY-MM-DD):');
                                                if (!d) { e.target.value = order.status; return; }
                                                handleStatusChange(order.id, s, d);
                                            } else if (s === 'REJECTED') {
                                                const r = prompt('Enter rejection reason:');
                                                if (!r) { e.target.value = order.status; return; }
                                                handleStatusChange(order.id, s, undefined, r);
                                            } else {
                                                handleStatusChange(order.id, s);
                                            }
                                        }}
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {order.orderItems?.slice(0, 3).map((item: any) => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-cream)', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem' }}>
                                            <img src={getImage(item.product?.images)} alt={item.product?.name} style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
                                            {item.product?.name} ×{item.quantity}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ---- Admin Support Queries ---- */
function AdminSupport() {
    const [queries, setQueries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const STATUS_COLOR: Record<string, string> = {
        OPEN: 'var(--color-error)',
        IN_PROGRESS: 'var(--color-warning)',
        RESOLVED: 'var(--color-success)'
    };

    const load = () => {
        setLoading(true);
        api.admin.getSupportQueries().then(setQueries).catch(() => {}).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await api.admin.updateSupportStatus(id, status);
            addToast('Status updated', 'success');
            load();
        } catch { addToast('Update failed', 'error'); }
    };

    return (
        <div>
            <h2 className="admin__section-title">Support Queries</h2>
            {loading ? <div className="skeleton" style={{ height: 300, borderRadius: 12 }} /> : queries.length === 0 ? (
                <div className="empty-state">No support queries submitted yet.</div>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>From</th><th>Subject</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            {queries.map(q => (
                                <tr key={q.id}>
                                    <td data-label="From">
                                        <p style={{ fontWeight: 600 }}>{q.email}</p>
                                        {q.user?.name && <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{q.user.name}</p>}
                                    </td>
                                    <td data-label="Subject">
                                        <p style={{ fontWeight: 600 }}>{q.subject}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.message}</p>
                                    </td>
                                    <td data-label="Status">
                                        <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 'var(--radius-full)', background: `${STATUS_COLOR[q.status] || '#888'}18`, color: STATUS_COLOR[q.status] || '#888', fontWeight: 700, fontSize: '0.72rem' }}>
                                            {q.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td data-label="Date" style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{new Date(q.createdAt).toLocaleDateString()}</td>
                                    <td data-label="Actions">
                                        <select className="form-input" style={{ fontSize: '0.8rem', padding: '4px 8px' }} value={q.status} onChange={e => handleStatusChange(q.id, e.target.value)}>
                                            <option value="OPEN">Open</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="RESOLVED">Resolved</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ---- Admin Reels ---- */
function AdminReels() {
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState('');
    const { addToast } = useToast();
    const { confirm } = useConfirm();

    const load = () => {
        setLoading(true);
        api.admin.getReels().then(setReels).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { url } = await api.uploadVideo(file);
            await api.admin.createReel({ title, videoUrl: url, priority: 0 });
            addToast('Reel uploaded and added!', 'success');
            setTitle('');
            load();
        } catch (err: any) {
            addToast(err.message || 'Upload failed', 'error');
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDelete = async (id: string) => {
        if (!(await confirm({
            title: 'Delete Reel',
            message: 'Are you sure you want to remove this reel?',
            confirmText: 'Delete',
            danger: true
        }))) return;

        try {
            await api.admin.deleteReel(id);
            addToast('Reel deleted', 'success');
            load();
        } catch {
            addToast('Delete failed', 'error');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 className="admin__section-title">Reels (Crafted Moments)</h2>
            </div>

            <div className="card" style={{ padding: 24, marginBottom: 32, border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Upload New Reel</h3>
                <div className="admin-reel-upload-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Reel Title (Optional)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Making of the Midnight Rose"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            disabled={uploading}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="btn btn-primary" style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
                            {uploading ? 'Uploading...' : <><FiUploadCloud /> Select Video & Upload</>}
                            <input
                                type="file"
                                accept="video/mp4,video/quicktime,video/webm"
                                style={{ display: 'none' }}
                                onChange={handleVideoSelect}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                </div>
                {uploading && (
                    <div className="alert-strip alert-strip--info" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiClock /> Uploading video... please wait (up to 50MB supported).
                    </div>
                )}
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
            ) : reels.length === 0 ? (
                <div className="empty-state">No reels added yet. Upload one above to get started!</div>
            ) : (
                <div className="admin-reels-grid">
                    {reels.map(reel => (
                        <div key={reel.id} className="admin-reel-card" style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative' }}>
                            <video
                                src={`${BACKEND}${reel.videoUrl}`}
                                style={{ width: '100%', height: 300, objectFit: 'cover' }}
                                muted
                                onMouseEnter={e => e.currentTarget.play()}
                                onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                            />
                            <div style={{ padding: 12 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {reel.title || 'Untitled Reel'}
                                </div>
                                <button
                                    className="btn btn-sm"
                                    style={{ width: '100%', background: 'rgba(192,57,43,0.1)', color: 'var(--color-error)', border: 'none' }}
                                    onClick={() => handleDelete(reel.id)}
                                >
                                    Delete
                                </button>
                            </div>
                            <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700 }}>
                                REEL
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ---- Admin Policies ---- */
function PolicyForm({ initial, onSave, onClose }: { initial?: any, onSave: () => void, onClose: () => void }) {
    const [form, setForm] = useState({
        title: initial?.title || '',
        slug: initial?.slug || '',
        content: initial?.content || '',
    });
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initial?.id) {
                await api.admin.updatePolicy(initial.id, form);
                addToast('Policy updated!', 'success');
            } else {
                await api.admin.createPolicy(form);
                addToast('Policy created!', 'success');
            }
            onSave();
        } catch (err: any) {
            addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 1000, width: '95%' }}>
                <div className="modal__header">
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem' }}>{initial ? 'Edit Policy' : 'New Policy'}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><FiX /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal__body admin-form-grid">
                        <div className="policy-editor-left">
                            <div className="form-group">
                                <label className="form-label">Policy Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Privacy Policy"
                                    value={form.title}
                                    onChange={e => {
                                        const newTitle = e.target.value;
                                        const newSlug = newTitle.toLowerCase().trim()
                                            .replace(/[^\w\s-]/g, '')
                                            .replace(/[\s_-]+/g, '-')
                                            .replace(/^-+|-+$/g, '');
                                        setForm(p => ({ ...p, title: newTitle, slug: newSlug }));
                                    }}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Content
                                </label>
                                <textarea
                                    className="form-input form-textarea"
                                    style={{ height: 400, fontSize: '14px', lineHeight: '1.6' }}
                                    placeholder="Type your policy content here. Line breaks are preserved."
                                    value={form.content}
                                    onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="policy-editor-right">
                            <label className="form-label" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>LIVE PREVIEW</label>
                            <div
                                className="policy-preview-container"
                                style={{
                                    height: 520,
                                    overflowY: 'auto',
                                    padding: 24,
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 12,
                                    background: 'white',
                                    lineHeight: '1.8',
                                    whiteSpace: 'pre-wrap',
                                    color: 'var(--color-text)'
                                }}
                            >
                                <h1 style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>{form.title || 'Policy Title'}</h1>
                                {form.content || 'Your content will appear here...'}
                            </div>
                            <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--color-muted)', background: 'var(--color-cream)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'start', gap: 8 }}>
                                <FiZap style={{ color: 'var(--color-secondary)', flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <strong>Tip:</strong> Simply type your policy text. Use double line breaks for new paragraphs. All formatting (like lists) should be done manually with plain text.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal__footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Policy'}
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
}

function AdminPolicies() {
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const { addToast } = useToast();
    const { confirm } = useConfirm();

    const load = () => {
        setLoading(true);
        api.admin.getPolicies().then(setPolicies).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleDelete = async (id: string) => {
        if (!(await confirm({
            title: 'Delete Policy',
            message: 'Are you sure you want to delete this policy?',
            confirmText: 'Delete',
            danger: true
        }))) return;
        try {
            await api.admin.deletePolicy(id);
            addToast('Policy deleted', 'success');
            load();
        } catch { addToast('Delete failed', 'error'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 className="admin__section-title">Store Policies</h2>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setFormOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiPlus /> Add Policy
                </button>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Title</th><th>Slug</th><th>Last Updated</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {policies.map(p => (
                                <tr key={p.id}>
                                    <td data-label="Title" style={{ fontWeight: 600 }}>{p.title}</td>
                                    <td data-label="Slug" style={{ color: 'var(--color-muted)' }}>/{p.slug}</td>
                                    <td data-label="Updated">{new Date(p.updatedAt).toLocaleDateString()}</td>
                                    <td data-label="Actions">
                                        <button className="btn btn-ghost btn-sm" style={{ marginRight: 6 }} onClick={() => { setEditing(p); setFormOpen(true); }}>Edit</button>
                                        <button className="btn btn-sm" style={{ background: 'rgba(192,57,43,0.1)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-full)', padding: '6px 16px', fontWeight: 600 }} onClick={() => handleDelete(p.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {policies.length === 0 && (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No policies found. Create one.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {formOpen && <PolicyForm initial={editing} onSave={() => { setFormOpen(false); load(); }} onClose={() => setFormOpen(false)} />}
        </div>
    );
}

/* ---- Main Dashboard ---- */
export default function AdminDashboard() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/admin', label: 'Products', icon: <FiShoppingBag /> },
        { path: '/admin/orders', label: 'Orders', icon: <FiPackage /> },
        { path: '/admin/users', label: 'Users', icon: <FiUser /> },
        { path: '/admin/support', label: 'Support', icon: <FiMessageSquare /> },
        { path: '/admin/reels', label: 'Reels', icon: <FiPlay /> },
        { path: '/admin/policies', label: 'Policies', icon: <FiFileText /> },
    ];

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="admin-dashboard">
            {/* Mobile Header */}
            <header className="admin-mobile-header">
                <div className="admin-mobile-header__inner">
                    <img src="/logo.png" alt="Logo" style={{ height: 32, width: 'auto', borderRadius: 4 }} />
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
                    <img src="/logo.png" alt="Logo" style={{ height: 40, width: 'auto', borderRadius: 6, marginBottom: 8 }} />
                    <span>Whiff & Wrap</span>
                    <div className="label-text" style={{ marginTop: 2, color: 'rgba(255,255,255,0.6)' }}>Admin</div>
                </div>

                <div className="admin-sidebar__profile">
                    {user?.image
                        ? <img src={user.image} alt={user.name} className="admin-sidebar__avatar" referrerPolicy="no-referrer" />
                        : <span className="admin-sidebar__avatar admin-sidebar__avatar--initials">{user?.name[0]?.toUpperCase() || 'A'}</span>
                    }
                    <div className="admin-sidebar__user-info">
                        <p className="admin-sidebar__user-name">{user?.name || 'Admin User'}</p>
                        <p className="admin-sidebar__user-email">{user?.email || 'admin@whiffwrap.com'}</p>
                    </div>
                </div>

                <nav className="admin-sidebar__nav">
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            className={`admin-sidebar__link ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span style={{ display: 'flex' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div style={{ padding: '0 var(--space-4)', marginTop: '20px' }}>
                    <Link to="/" className="admin-sidebar__link" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FiArrowLeft />
                        <span>Back to Store</span>
                    </Link>
                </div>
            </aside>

            {/* Sidebar backdrop (mobile) */}
            {mobileMenuOpen && (
                <div
                    className="admin-sidebar-backdrop"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main */}
            <main className="admin-main">
                <Routes>
                    <Route path="/" element={<AdminProducts />} />
                    <Route path="/orders" element={<AdminOrders />} />
                    <Route path="/users" element={<AdminUsers />} />
                    <Route path="/support" element={<AdminSupport />} />
                    <Route path="/reels" element={<AdminReels />} />
                    <Route path="/policies" element={<AdminPolicies />} />
                </Routes>
            </main>
        </div>
    );
}

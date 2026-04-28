import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import { FiArrowLeft, FiX, FiUploadCloud, FiInstagram } from 'react-icons/fi';
import './SupportPage.css';

export default function SupportPage() {
    const { user } = useAuth();
    const { addToast } = useToast();

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [subject, setSubject] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [screenshots, setScreenshots] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (screenshots.length + files.length > 5) {
            addToast('You can only upload up to 5 screenshots', 'error');
            return;
        }

        const newScreenshots = [...screenshots, ...files];
        setScreenshots(newScreenshots);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeScreenshot = (index: number) => {
        const newScreenshots = [...screenshots];
        newScreenshots.splice(index, 1);
        setScreenshots(newScreenshots);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !subject || !message) {
            addToast('Please fill in all required fields', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('subject', subject);
            formData.append('message', message);
            if (user?.id) formData.append('userId', user.id);

            screenshots.forEach(file => {
                formData.append('screenshots', file);
            });

            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${apiBase}/api/support`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Submission failed');

            addToast('Support query sent successfully! We will get back to you soon.', 'success');
            setSubject('');
            setMessage('');
            setScreenshots([]);
            setPreviews([]);
        } catch (err) {
            console.error('Submission error:', err);
            addToast('Failed to send support query. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="support-page container">
            <div className="support-header">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <button
                        onClick={() => window.history.back()}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <FiArrowLeft /> Back
                    </button>
                </div>
                <span className="label-text">Help & Support</span>
                <h1 className="section-title">How can we help?</h1>
                <p className="section-subtitle">
                    Found an issue or have a question? Describe it below and we'll get back to you as soon as possible.
                </p>
            </div>

            <div className="support-content">
                <form className="support-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Your Email Address *</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="email@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="subject">Subject *</label>
                        <input
                            id="subject"
                            type="text"
                            placeholder="What's this about?"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">Message / Issue Details *</label>
                        <textarea
                            id="message"
                            rows={8}
                            placeholder="Please describe the issue or your question in detail..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Screenshots (Max 5)</label>
                        <div className="file-upload-container" onClick={() => fileInputRef.current?.click()}>
                            <div className="file-upload-placeholder">
                                <FiUploadCloud style={{ width: 32, height: 32, marginBottom: 'var(--space-2)', color: 'var(--color-primary)' }} />
                                <span>Click to Upload screenshots</span>
                                <small>Or drag and drop files here (PNG, JPG up to 10MB)</small>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {previews.length > 0 && (
                            <div className="screenshot-previews">
                                {previews.map((src, idx) => (
                                    <div key={idx} className="screenshot-preview">
                                        <img src={src} alt={`Preview ${idx + 1}`} />
                                        <button
                                            type="button"
                                            className="remove-screenshot"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeScreenshot(idx);
                                            }}
                                        ><FiX /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg btn-block"
                        disabled={submitting}
                    >
                        {submitting ? 'Sending...' : 'Submit Support Query'}
                    </button>
                </form>

                <div className="support-info">
                    <div className="support-card">
                        <h3>Direct Contact</h3>
                        <p>Prefer other ways to reach us?</p>
                        <div className="support-links">
                            <a href="https://instagram.com/_whiffandwrap_" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm btn-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <FiInstagram /> Contact on Instagram
                            </a>
                        </div>
                    </div>

                    <div className="support-card" style={{ marginTop: 'var(--space-6)' }}>
                        <h3>Website Help</h3>
                        <ul className="faq-list">
                            <li>Page not loading? Try refreshing your browser.</li>
                            <li>Button not working? Report it here with a screenshot.</li>
                            <li>Login problems? Double check your email or Google account.</li>
                            <li>Upload errors? Ensure images are under 10MB each.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

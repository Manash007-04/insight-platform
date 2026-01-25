
import React, { useRef, useState, useEffect } from 'react';
import { Pen, Eraser, Type, Undo, Trash2, Save, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { pdfjs } from 'react-pdf';
import { jsPDF } from 'jspdf';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FileAnnotator = ({ fileUrl, fileType = 'image', initialAnnotations = [], onSave, onSaveImage, readOnly = false }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Tools State
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#ef4444');
    const [lineWidth, setLineWidth] = useState(3);
    const [annotations, setAnnotations] = useState(initialAnnotations || []);
    const [currentPath, setCurrentPath] = useState([]);

    // Image/PDF State
    const [bgImage, setBgImage] = useState(null); // The rendered image (or original image)
    const [imageLoaded, setImageLoaded] = useState(false);

    // PDF Specific State
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 1. Initial Load of PDF or Image
    useEffect(() => {
        if (fileType === 'pdf') {
            setIsLoadingPdf(true);
            const loadingTask = pdfjs.getDocument(fileUrl);
            loadingTask.promise.then((pdf) => {
                setPdfDoc(pdf);
                setNumPages(pdf.numPages);
                setIsLoadingPdf(false);
            }).catch(err => {
                console.error("Error loading PDF:", err);
                setIsLoadingPdf(false);
            });
        } else {
            setBgImage(fileUrl);
            setPdfDoc(null);
        }
    }, [fileUrl, fileType]);

    // 2. Render Page to Image (PDF Only)
    useEffect(() => {
        if (!pdfDoc) return;

        setIsLoadingPdf(true);
        pdfDoc.getPage(pageNumber).then((page) => {
            const viewport = page.getViewport({ scale: 1.5 }); // Good quality scale
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            page.render(renderContext).promise.then(() => {
                setBgImage(canvas.toDataURL('image/png'));
                setIsLoadingPdf(false);
            });
        });
    }, [pdfDoc, pageNumber]);

    // 3. Setup/Resize Annotation Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        // Logic: Wait for image to load to know dimensions, then match canvas to image rendered size
        // MVP: Canvas fills container, Image fits in container.

        if (!canvas || !container) return;

        const resizeCanvas = () => {
            // For simple absolute alignment, we need the visualized image size
            // To simplify, we will use the container size
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            redrawCanvas();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [imageLoaded, annotations, bgImage]);

    // 4. Redraw Annotations
    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const currentPageAnnotations = annotations.filter(a => !a.page || a.page === pageNumber);

        currentPageAnnotations.forEach(ann => {
            if (ann.type === 'path') {
                ctx.beginPath();
                ctx.strokeStyle = ann.color;
                ctx.lineWidth = ann.width;
                if (ann.isEraser) {
                    ctx.globalCompositeOperation = 'destination-out';
                }
                if (ann.points.length > 0) {
                    const first = ann.points[0];
                    ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
                    for (let i = 1; i < ann.points.length; i++) {
                        const p = ann.points[i];
                        ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
                    }
                    ctx.stroke();
                }
                ctx.globalCompositeOperation = 'source-over'; // Reset
            } else if (ann.type === 'text') {
                ctx.font = 'bold 16px sans-serif';
                ctx.fillStyle = ann.color;
                ctx.fillText(ann.text, ann.x * canvas.width, ann.y * canvas.height);
            }
        });
    };

    // 5. Drawing Handlers (Generic)
    const startDrawing = (e) => {
        if (readOnly) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / canvas.width;
        const y = (e.clientY - rect.top) / canvas.height;

        if (tool === 'text') {
            const text = prompt("Enter text annotation:");
            if (text) {
                const newAnn = { type: 'text', text, x, y, color, page: pageNumber };
                const updated = [...annotations, newAnn];
                setAnnotations(updated);
                onSave(updated);
            }
            return;
        }

        setIsDrawing(true);
        setCurrentPath([{ x, y }]);

        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
        ctx.moveTo(x * canvas.width, y * canvas.height);
    };

    const draw = (e) => {
        if (!isDrawing || readOnly) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / canvas.width;
        const y = (e.clientY - rect.top) / canvas.height;

        setCurrentPath(prev => [...prev, { x, y }]);

        const ctx = canvas.getContext('2d');
        const last = currentPath[currentPath.length - 1];
        if (last) {
            ctx.beginPath();
            ctx.strokeStyle = tool === 'eraser' ? 'rgba(255,255,255,1)' : color; // Eraser paints white (on white paper)
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'; // Actually clear if eraser
            // Note: 'destination-out' erases the canvas (transparent).
            // If background is image, this reveals image. Perfect.

            ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(last.x * canvas.width, last.y * canvas.height);
            ctx.lineTo(x * canvas.width, y * canvas.height);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over'; // Reset to default
        }
    };

    const stopDrawing = () => {
        if (!isDrawing || readOnly) return;
        setIsDrawing(false);

        if (currentPath.length > 0) {
            const newAnn = {
                type: 'path',
                points: currentPath,
                color: tool === 'eraser' ? '#ffffff' : color,
                width: tool === 'eraser' ? 20 : lineWidth,
                isEraser: tool === 'eraser',
                page: pageNumber
            };

            const updated = [...annotations, newAnn];
            setAnnotations(updated);
            onSave(updated);
        }
        setCurrentPath([]);
        redrawCanvas();
    };

    // 6. Action Handlers
    const handleUndo = () => {
        // Find last annotation for current page
        const lastIndex = annotations.map((a, i) => ({ ...a, idx: i }))
            .filter(a => (!a.page || a.page === pageNumber))
            .pop()?.idx;
        if (lastIndex !== undefined) {
            const updated = annotations.filter((_, i) => i !== lastIndex);
            setAnnotations(updated);
            onSave(updated);
        }
    };

    const handleClear = () => {
        if (confirm("Clear page?")) {
            const updated = annotations.filter(a => (a.page && a.page !== pageNumber));
            setAnnotations(updated);
            onSave(updated);
        }
    };

    const handleSave = async () => {
        if (!onSaveImage) return;
        setIsSaving(true);

        try {
            if (fileType === 'pdf' && pdfDoc) {
                // Generate PDF
                const pdf = new jsPDF();

                for (let i = 1; i <= numPages; i++) {
                    if (i > 1) pdf.addPage();

                    const page = await pdfDoc.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });

                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext('2d');

                    // Render PDF page to canvas
                    await page.render({ canvasContext: ctx, viewport }).promise;

                    // Overlay annotations for this page
                    const pageAnns = annotations.filter(a => a.page === i);
                    if (pageAnns.length > 0) {
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        pageAnns.forEach(ann => {
                            if (ann.type === 'path') {
                                ctx.beginPath();
                                ctx.strokeStyle = ann.color;
                                ctx.lineWidth = ann.width;
                                if (ann.isEraser) {
                                    ctx.globalCompositeOperation = 'destination-out';
                                }
                                if (ann.points.length > 0) {
                                    const first = ann.points[0];
                                    ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
                                    for (let j = 1; j < ann.points.length; j++) {
                                        const p = ann.points[j];
                                        ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
                                    }
                                    ctx.stroke();
                                }
                                ctx.globalCompositeOperation = 'source-over';
                            } else if (ann.type === 'text') {
                                ctx.font = 'bold 16px sans-serif';
                                ctx.fillStyle = ann.color;
                                ctx.fillText(ann.text, ann.x * canvas.width, ann.y * canvas.height);
                            }
                        });
                    }

                    const imgData = canvas.toDataURL('image/jpeg', 0.85);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                }

                const pdfBlob = pdf.output('blob');
                const file = new File([pdfBlob], "annotated_submission.pdf", { type: "application/pdf" });
                onSaveImage(file);

            } else {
                // Image Handling (Single Page)
                const canvas = canvasRef.current;
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const ctx = tempCanvas.getContext('2d');

                const img = new Image();
                img.src = bgImage;
                await new Promise(resolve => {
                    img.onload = () => {
                        const hRatio = canvas.width / img.width;
                        const vRatio = canvas.height / img.height;
                        const ratio = Math.min(hRatio, vRatio);
                        const centerShift_x = (canvas.width - img.width * ratio) / 2;
                        const centerShift_y = (canvas.height - img.height * ratio) / 2;

                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
                        resolve();
                    }
                });

                // Draw Annotations
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                const currentPageAnnotations = annotations.filter(a => !a.page || a.page === pageNumber);
                currentPageAnnotations.forEach(ann => {
                    if (ann.type === 'path') {
                        ctx.beginPath();
                        ctx.strokeStyle = ann.color;
                        ctx.lineWidth = ann.width;
                        if (ann.isEraser) {
                            ctx.globalCompositeOperation = 'destination-out';
                        }
                        if (ann.points.length > 0) {
                            const first = ann.points[0];
                            ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
                            for (let i = 1; i < ann.points.length; i++) {
                                const p = ann.points[i];
                                ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
                            }
                            ctx.stroke();
                        }
                        ctx.globalCompositeOperation = 'source-over';
                    } else if (ann.type === 'text') {
                        ctx.font = 'bold 16px sans-serif';
                        ctx.fillStyle = ann.color;
                        ctx.fillText(ann.text, ann.x * canvas.width, ann.y * canvas.height);
                    }
                });

                tempCanvas.toBlob((blob) => {
                    const fileName = `annotated_${fileType}_page${pageNumber}.jpg`;
                    const file = new File([blob], fileName, { type: "image/jpeg" });
                    onSaveImage(file);
                }, 'image/jpeg', 0.85);
            }
        } catch (error) {
            console.error("Error saving annotation:", error);
            alert("Failed to save annotated file.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className={`p-2 bg-white border-b border-gray-200 flex items-center justify-between gap-2 ${readOnly ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-1">
                    <ToolButton active={tool === 'pen'} onClick={() => setTool('pen')} icon={Pen} title="Pen" color={tool === 'pen' ? color : 'current'} />
                    <ToolButton active={tool === 'text'} onClick={() => setTool('text')} icon={Type} title="Text" />
                    <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={Eraser} title="Eraser" />
                    <div className="w-px h-6 bg-gray-200 mx-2"></div>
                    <ColorButton color="#ef4444" active={color === '#ef4444'} onClick={() => setColor('#ef4444')} />
                    <ColorButton color="#22c55e" active={color === '#22c55e'} onClick={() => setColor('#22c55e')} />
                    <ColorButton color="#3b82f6" active={color === '#3b82f6'} onClick={() => setColor('#3b82f6')} />
                </div>

                {numPages && (
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                        <button
                            disabled={pageNumber <= 1}
                            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-medium whitespace-nowrap">Pg {pageNumber} / {numPages}</span>
                        <button
                            disabled={pageNumber >= numPages}
                            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-1">
                    <button onClick={handleUndo} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Undo">
                        <Undo size={18} />
                    </button>
                    <button onClick={handleClear} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Clear">
                        <Trash2 size={18} />
                    </button>
                    {onSaveImage && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="ml-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                            {isSaving ? <Loader className="animate-spin" size={14} /> : <Save size={14} />}
                            {fileType === 'pdf' ? 'Save PDF' : 'Save Image'}
                        </button>
                    )}
                </div>
            </div>

            {/* Canvas Container */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-200 flex items-center justify-center">
                {isLoadingPdf ? (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Loader className="animate-spin" size={24} />
                        <span>Rendering PDF...</span>
                    </div>
                ) : (bgImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={bgImage}
                            alt="Content"
                            className="max-w-full max-h-full object-contain pointer-events-none select-none"
                            onLoad={() => setImageLoaded(true)}
                        />
                        <canvas
                            ref={canvasRef}
                            className={`absolute inset-0 w-full h-full z-10 ${tool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                    </div>
                ) : (
                    <div className="text-gray-400">No content loaded</div>
                ))}
            </div>
        </div>
    );
};

// ... Buttons (Keep same)
const ToolButton = ({ active, onClick, icon: Icon, title, color }) => (
    <button onClick={onClick} className={`p-2 rounded-lg transition-colors ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`} title={title} style={{ color: active && color !== 'current' ? color : undefined }}><Icon size={18} /></button>
);
const ColorButton = ({ color, active, onClick }) => (
    <button onClick={onClick} className={`w-5 h-5 rounded-full border-2 transition-transform ${active ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: color }} />
);

export default FileAnnotator;

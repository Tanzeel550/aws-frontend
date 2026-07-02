import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Upload, 
  Edit3, 
  History, 
  RotateCcw, 
  Play, 
  LogOut, 
  Image as ImageIcon, 
  Trash2, 
  Cpu, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function Dashboard({ token, email, onLogout }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'draw'
  const [history, setHistory] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Drawing canvas references
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Axios config with authorization header
  const apiConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  };

  // Fetch prediction history
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await axios.get('/api/predict/history/', apiConfig);
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  // Handle file select
  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG).');
      return;
    }
    setError('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Submit image file to classification API
  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post('/api/predict/upload/', formData, {
        headers: {
          ...apiConfig.headers,
          'Content-Type': 'multipart/form-data',
        }
      });
      setResult(response.data);
      // Refresh history list
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to predict the image digit.');
    } finally {
      setLoading(false);
    }
  };

  // Reset upload tab
  const handleResetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
  };

  /* Drawing Canvas Methods */
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Fill canvas background with solid black (matches MNIST format)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (activeTab === 'draw') {
      setTimeout(initCanvas, 50); // Slight delay to ensure canvas element is mounted
      setResult(null);
      setError('');
    }
  }, [activeTab]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Handle touch events
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    // Handle mouse events
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    lastPosRef.current = getCoordinates(e);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentPos = getCoordinates(e);

    ctx.strokeStyle = '#ffffff'; // White pen on black background
    ctx.lineWidth = 18;         // Thick line matching MNIST digits stroke thickness
    ctx.lineCap = 'round';       // Round endpoints
    ctx.lineJoin = 'round';      // Round corners

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    lastPosRef.current = currentPos;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    initCanvas();
    setResult(null);
    setError('');
  };

  // Convert painted canvas contents to File and submit to API
  const handleCanvasSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);
    setError('');
    setResult(null);

    // Convert canvas content to blob, then file, then upload
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Could not read image content.');
        setLoading(false);
        return;
      }
      
      const file = new File([blob], 'drawn_digit.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('image', file);

      axios.post('/api/predict/upload/', formData, {
        headers: {
          ...apiConfig.headers,
          'Content-Type': 'multipart/form-data',
        }
      })
      .then((response) => {
        setResult(response.data);
        fetchHistory();
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to analyze the drawn digit.');
      })
      .finally(() => {
        setLoading(false);
      });
    }, 'image/png');
  };

  // Format date helper
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      {/* Header bar */}
      <header className="navbar">
        <a href="#" className="nav-logo">
          <Cpu size={24} style={{ color: '#8b5cf6' }} />
          <span>MNIST Neural Classifier</span>
        </a>
        <div className="nav-user">
          <span className="user-email">{email}</span>
          <button className="btn btn-secondary btn-danger" onClick={onLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="dashboard-grid">
        
        {/* Sidebar History Panel */}
        <div className="glass-panel sidebar-panel">
          <div className="sidebar-header">
            <History size={18} style={{ color: '#8b5cf6' }} />
            <h3>History</h3>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.125rem 0.5rem', borderRadius: '10px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              {history.length}
            </span>
          </div>

          <div className="history-list">
            {historyLoading && history.length === 0 ? (
              <div className="empty-history">
                <span className="loader-spinner" style={{ width: '24px', height: '24px', borderWidth: '2px' }}></span>
                <p>Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="empty-history">
                <ImageIcon size={32} />
                <p>No predictions yet</p>
                <span style={{ fontSize: '0.75rem' }}>Upload or draw a digit to see it here!</span>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="history-item">
                  <img src={item.image} alt={`Digit ${item.predicted_class}`} className="history-thumb" />
                  <div className="history-details">
                    <div className="history-pred">
                      <span>Prediction</span>
                      <span className="pred-badge">{item.predicted_class}</span>
                    </div>
                    <div className="history-conf">
                      Confidence: {item.confidence.toFixed(2)}%
                    </div>
                    <div className="history-time">
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Workspace Testing Center */}
        <div className="workspace-container">
          
          {/* Tab Selector */}
          <div className="tab-selector">
            <button 
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={16} />
              Upload Image
            </button>
            <button 
              className={`tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
              onClick={() => setActiveTab('draw')}
            >
              <Edit3 size={16} />
              Draw Digit
            </button>
          </div>

          {/* Tab Workspace Panel */}
          <div className="glass-panel workspace-card">
            
            {activeTab === 'upload' ? (
              <>
                <div className="workspace-header">
                  <h2>Upload MNIST Digit</h2>
                  <p>Drag & drop or upload a handwritten digit image (ideally a square centered digit on a dark background. If background is light, it will be automatically inverted).</p>
                </div>

                {error && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {!selectedFile ? (
                  <div 
                    className={`dropzone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-picker').click()}
                  >
                    <input 
                      type="file" 
                      id="file-picker" 
                      style={{ display: 'none' }} 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                    />
                    <Upload className="dropzone-icon" size={48} />
                    <p className="dropzone-text">Drag & drop your file here or click to browse</p>
                    <p className="dropzone-subtext">Supports PNG, JPG, JPEG up to 5MB</p>
                  </div>
                ) : (
                  <div className="preview-container">
                    <div className="image-preview-wrapper">
                      <img src={previewUrl} alt="Preview" className="image-preview" />
                    </div>

                    {!result && !loading && (
                      <div className="preview-actions">
                        <button className="btn btn-secondary" onClick={handleResetUpload}>
                          <Trash2 size={16} />
                          Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleUploadSubmit}>
                          <Play size={16} />
                          Classify Digit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="workspace-header">
                  <h2>Draw Digit</h2>
                  <p>Use your cursor (or touch screen) to paint a single digit (0-9) inside the grid. Try to write in the center of the canvas.</p>
                </div>

                {error && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="canvas-container">
                  <div className="canvas-board-wrapper">
                    <canvas
                      ref={canvasRef}
                      width={280}
                      height={280}
                      className="canvas-board"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>

                  {!result && !loading && (
                    <div className="canvas-actions">
                      <button className="btn btn-secondary" onClick={clearCanvas}>
                        <RotateCcw size={16} />
                        Clear Canvas
                      </button>
                      <button className="btn btn-primary" onClick={handleCanvasSubmit}>
                        <Cpu size={16} />
                        Recognize Drawing
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Inference Loader Screen */}
            {loading && (
              <div className="analyzing-overlay">
                <span className="loader-spinner"></span>
                <h3>Running Neural Network...</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Downloading weights from S3 or running feedforward pass</p>
              </div>
            )}

            {/* Inference Result Display */}
            {result && !loading && (
              <div className="result-container">
                <div className="result-image-panel">
                  <span className="result-image-label">Input Image</span>
                  <div className="result-img-wrapper">
                    <img src={result.image} alt="Classified" className="result-img" />
                  </div>
                </div>

                <div className="result-stats-panel">
                  <div>
                    <span className="result-header">Neural Network Prediction</span>
                    <div className="result-digit-row">
                      <span className="result-digit">{result.predicted_class}</span>
                      <span className="result-digit-label">Digit Recognized</span>
                    </div>
                  </div>

                  <div className="confidence-gauge-container">
                    <div className="confidence-header">
                      <span>Inference Confidence</span>
                      <span style={{ fontWeight: '700', color: '#8b5cf6' }}>{result.confidence.toFixed(2)}%</span>
                    </div>
                    <div className="confidence-bar-bg">
                      <div 
                        className="confidence-bar-fill" 
                        style={{ width: `${result.confidence}%` }}
                      ></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={activeTab === 'upload' ? handleResetUpload : clearCanvas}
                    >
                      <RotateCcw size={16} />
                      Test Another
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}

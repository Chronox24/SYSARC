import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import QRCode from 'qrcode'
import '../styles/AdminFlux.css'
import '../styles/WordEditor.css'

const getWordCount = (html) => {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(/\s+/).length : 0;
};

const DocumentEditor = React.memo(({ initialContent, requestId, onChange }) => {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: initialContent }}
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
      className="word-editor-content"
      title="Click here to type your official document content"
    />
  );
}, (prevProps, nextProps) => prevProps.requestId === nextProps.requestId);

// --- FLOATING IMAGE COMPONENT (Just like Microsoft Word: Free Movement & Text Overlay) ---
const FloatingDocumentImage = ({ img, isSelected, onSelect, onUpdate, onDelete }) => {
  const isFront = img.layer === 'front';

  const handleMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('.word-img-btn') || e.target.closest('.word-img-resize-handle')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = img.x || 0;
    const startY = img.y || 0;

    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;
      onUpdate({
        x: Math.round(startX + deltaX),
        y: Math.round(startY + deltaY)
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startMouseX = e.clientX;
    const startWidth = img.width || 150;

    const handleResizeMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startMouseX;
      const newWidth = Math.max(40, Math.min(800, Math.round(startWidth + deltaX)));
      onUpdate({ width: newWidth });
    };

    const handleResizeMouseUp = () => {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    };

    window.addEventListener('mousemove', handleResizeMouseMove);
    window.addEventListener('mouseup', handleResizeMouseUp);
  };

  return (
    <div
      className={`word-floating-image-wrapper ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: `${img.x || 0}px`,
        top: `${img.y || 0}px`,
        width: `${img.width || 150}px`,
        zIndex: isSelected ? 30 : (isFront ? 20 : 1),
        cursor: 'move',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* Visual Image */}
      <img
        src={img.src}
        alt={img.name || 'Attached Element'}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          opacity: img.opacity !== undefined ? img.opacity : 1,
          pointerEvents: 'none',
          boxShadow: isSelected ? '0 4px 15px rgba(37,99,235,0.25)' : 'none'
        }}
        draggable={false}
      />

      {/* Floating Header Tag Handle (always clickable even when Behind Text) */}
      <div 
        className="word-img-pill-handle"
        style={{
          position: 'absolute',
          top: '-24px',
          left: '0',
          backgroundColor: isSelected ? '#2563eb' : '#334155',
          color: '#ffffff',
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          zIndex: 35,
          cursor: 'move',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        <span>✥</span>
        <span>{img.name || 'Image'}</span>
        <span style={{ fontSize: '9px', opacity: 0.85, marginLeft: '2px' }}>
          ({isFront ? 'In Front' : 'Behind Text'})
        </span>
      </div>

      {/* Selected Controls & Word-Style Floating Mini-Toolbar */}
      {isSelected && (
        <>
          <div
            className="word-img-floating-toolbar"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 28px)',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              zIndex: 40,
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Overlay Mode Toggle */}
            <button
              type="button"
              className="word-img-btn"
              title={isFront ? "Click to move Behind Text (Watermark mode)" : "Click to move In Front of Text (Overlay mode)"}
              onClick={() => onUpdate({ layer: isFront ? 'behind' : 'front' })}
              style={{
                backgroundColor: isFront ? '#3b82f6' : '#64748b',
                color: '#ffffff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isFront ? '🔲 In Front of Text' : '🔳 Behind Text'}
            </button>

            {/* Opacity Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Opacity:</span>
              <button
                type="button"
                className="word-img-btn"
                onClick={() => onUpdate({ opacity: 1.0 })}
                style={{
                  background: img.opacity === 1 ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                100%
              </button>
              <button
                type="button"
                className="word-img-btn"
                onClick={() => onUpdate({ opacity: 0.6 })}
                style={{
                  background: img.opacity === 0.6 ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                60%
              </button>
              <button
                type="button"
                className="word-img-btn"
                onClick={() => onUpdate({ opacity: 0.25 })}
                style={{
                  background: img.opacity === 0.25 ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                25%
              </button>
            </div>

            {/* Size adjustments */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                type="button"
                className="word-img-btn"
                title="Decrease size"
                onClick={() => onUpdate({ width: Math.max(40, (img.width || 150) - 25) })}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                ➖
              </button>
              <span style={{ fontSize: '11px', minWidth: '38px', textAlign: 'center' }}>{img.width || 150}px</span>
              <button
                type="button"
                className="word-img-btn"
                title="Increase size"
                onClick={() => onUpdate({ width: Math.min(800, (img.width || 150) + 25) })}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                ➕
              </button>
            </div>

            {/* Delete button */}
            <button
              type="button"
              className="word-img-btn"
              title="Remove image from document"
              onClick={onDelete}
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              🗑️
            </button>
          </div>

          {/* Bottom-right Corner Resize Handle */}
          <div
            className="word-img-resize-handle"
            onMouseDown={handleResizeMouseDown}
            style={{
              position: 'absolute',
              right: '-6px',
              bottom: '-6px',
              width: '14px',
              height: '14px',
              backgroundColor: '#2563eb',
              border: '2px solid #ffffff',
              borderRadius: '50%',
              cursor: 'se-resize',
              zIndex: 35,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
            title="Drag to resize image"
          />
        </>
      )}
    </div>
  );
};

// Helper: Compile document HTML with embedded floating images
const compileDocumentWithImages = (htmlContent, images) => {
  let cleanHtml = (htmlContent || '')
    .replace(/<!--ATTACHED_IMAGES_START-->[\s\S]*?<!--ATTACHED_IMAGES_END-->/g, '')
    .trim();

  if (!images || images.length === 0) {
    return cleanHtml;
  }

  const imagesJson = JSON.stringify(images);
  const renderedImages = images.map(img => {
    return `<div class="word-floating-image-render" style="position: absolute; left: ${img.x || 0}px; top: ${img.y || 0}px; width: ${img.width || 150}px; z-index: ${img.layer === 'front' ? 20 : 1}; opacity: ${img.opacity !== undefined ? img.opacity : 1}; pointer-events: none;"><img src="${img.src}" alt="${img.name || 'Image'}" style="width: 100%; height: auto; display: block;" /></div>`;
  }).join('\n');

  return `<!--ATTACHED_IMAGES_START-->
<div id="word-attached-images-meta" data-images='${imagesJson.replace(/'/g, "&apos;")}' style="display: none;"></div>
<div class="word-attached-images-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
${renderedImages}
</div>
<!--ATTACHED_IMAGES_END-->
${cleanHtml}`;
};

// Helper: Parse document HTML into text content and interactive image state
const parseDocumentAndImages = (rawHtml) => {
  if (!rawHtml) return { cleanContent: '', images: [] };
  
  const metaMatch = rawHtml.match(/id="word-attached-images-meta"\s+data-images='([^']+)'/);
  let images = [];
  if (metaMatch && metaMatch[1]) {
    try {
      images = JSON.parse(metaMatch[1].replace(/&apos;/g, "'"));
    } catch (e) {
      console.warn('Could not parse attached images:', e);
    }
  }
  
  const cleanContent = rawHtml
    .replace(/<!--ATTACHED_IMAGES_START-->[\s\S]*?<!--ATTACHED_IMAGES_END-->/g, '')
    .trim();
    
  return { cleanContent, images };
};


const getCertificateTemplate = (r, overrideType = null) => {
  const type = overrideType || r.certificate_type || 'Barangay Certificate';
  const residentName = (r.full_name || r.resident_name || 'Resident Name').toUpperCase();
  const age = r.age ? `${r.age}` : '___';
  const civilStatus = r.civil_status || 'Single';
  const address = r.home_address || r.address || 'Barangay 830, Zone 90, Manila';
  const nationality = r.nationality || 'Filipino';
  const purpose = (r.purpose || '').trim();
  const purposeUpper = purpose ? purpose.toUpperCase() : 'WHATEVER LEGAL PURPOSE IT MAY SERVE';
  const tracking = (r.tracking_code || '830000').slice(0, 6).toUpperCase();
  const year = new Date().getFullYear();
  const controlNo = `BC-${year}-${tracking}`;

  const now = new Date();
  const dayNum = now.getDate();
  const daySuffix = (d) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  const issueDay = `${dayNum}${daySuffix(dayNum)}`;
  const issueMonthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const fullDateStr = now.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });

  // Pronoun detection
  const pLower = (purpose + ' ' + (r.gender || '') + ' ' + (r.civil_status || '') + ' ' + residentName).toLowerCase();
  const isFemale = pLower.includes('female') || pLower.includes('mrs') || pLower.includes('mother') || pLower.includes('daughter') ||
    /\b(maria|mary|elena|aileen|ana|joan|lolly|norma|wenda|lea|fatima|daenishe|melissa|belinda|emily|jacquelyn|pedencia|paz|rose|grace|faith|zakia|solita|pierre)\b/i.test(residentName);
  
  const heShe = isFemale ? 'she' : 'he';
  const heSheUpper = isFemale ? 'She' : 'He';
  const hisHer = isFemale ? 'her' : 'his';
  const hisHerUpper = isFemale ? 'Her' : 'His';
  const himHer = isFemale ? 'her' : 'him';

  // Standard Header HTML
  const headerHtml = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 15px;">
      <div style="width: 90px; height: 90px; display: flex; align-items: center; justify-content: center;">
        <img src="/logo_brgy.png" alt="Brgy Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
      </div>
      <div style="flex: 1; text-align: center; line-height: 1.3;">
        <div style="display: flex; justify-content: center; margin-bottom: 4px;">
          <img src="/logo_manila.png" alt="City of Manila Seal" style="width: 50px; height: 50px; object-fit: contain;" />
        </div>
        <p style="margin: 0; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Republic of the Philippines</p>
        <p style="margin: 0; font-size: 11px; font-weight: 500; text-transform: uppercase;">City of Manila</p>
        <p style="margin: 1px 0; font-size: 14px; font-weight: bold; letter-spacing: 0.5px; color: #0f172a;">Barangay 830, Zone 90, District VI</p>
        <p style="margin: 0; font-size: 11px; color: #334155;">South Nagtahan, Paco, Manila</p>
        <p style="margin: 0; font-size: 10.5px; color: #334155;">Email: <a href="mailto:barangay830zone90@gmail.com" style="color: #1d4ed8; text-decoration: underline;">barangay830zone90@gmail.com</a> | Tel #: 8275-2818</p>
      </div>
      <div style="width: 90px; height: 90px; display: flex; align-items: center; justify-content: center;">
        <img src="/logo_bagong_pilipinas.png" alt="Bagong Pilipinas" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
      </div>
    </div>
  `;

  // Standard Officials Left Sidebar HTML
  const sidebarHtml = `
    <div style="width: 200px; background-color: #9bbcc4; padding: 22px 10px; border-right: 1px solid #000; text-align: center; box-sizing: border-box; flex-shrink: 0;">
      <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 6px;">Barangay 830<br/><span style="font-size: 12px; font-weight: 600;">Zone 90 Dist VI</span></h3>
      
      <h4 style="margin: 0 0 2px 0; font-size: 12px; color: #991b1b; font-weight: bold; text-transform: uppercase;">BRGY Chairman</h4>
      <p style="margin: 0 0 14px 0; font-size: 11px; font-weight: bold; color: #000;">EFREN V. MEDINA</p>
      
      <h4 style="margin: 0 0 6px 0; font-size: 12px; color: #991b1b; font-weight: bold; text-transform: uppercase;">BARANGAY<br/>KAGAWAD</h4>
      <p style="margin: 0 0 5px 0; font-size: 10.5px; font-weight: bold; color: #000;">Mercedita O. Lacson</p>
      <p style="margin: 0 0 5px 0; font-size: 10.5px; font-weight: bold; color: #000;">Catherine S. Gabriel</p>
      <p style="margin: 0 0 5px 0; font-size: 10.5px; font-weight: bold; color: #000;">Jordan T. Lumanao</p>
      <p style="margin: 0 0 5px 0; font-size: 10.5px; font-weight: bold; color: #000;">Purisima P. Albasin</p>
      <p style="margin: 0 0 5px 0; font-size: 10.5px; font-weight: bold; color: #000;">Elnora C. Gamit</p>
      <p style="margin: 0 0 5px 0; font-size: 10.5px; font-weight: bold; color: #000;">Lady P. Abad</p>
      <p style="margin: 0 0 16px 0; font-size: 10.5px; font-weight: bold; color: #000;">Annabelle S. Cagat</p>
      
      <h4 style="margin: 0 0 2px 0; font-size: 12px; color: #991b1b; font-weight: bold; text-transform: uppercase;">SK CHAIRMAN</h4>
      <p style="margin: 0 0 16px 0; font-size: 10.5px; font-weight: bold; color: #000;">Wilton John B. Padlan</p>
      
      <h4 style="margin: 0 0 2px 0; font-size: 12px; color: #991b1b; font-weight: bold; text-transform: uppercase;">SECRETARY</h4>
      <p style="margin: 0 0 16px 0; font-size: 10.5px; font-weight: bold; color: #000;">Jonathan C. Florencio Jr.</p>
      
      <h4 style="margin: 0 0 2px 0; font-size: 12px; color: #991b1b; font-weight: bold; text-transform: uppercase;">TREASURER</h4>
      <p style="margin: 0 0 8px 0; font-size: 10.5px; font-weight: bold; color: #000;">Dina J. Pedenes</p>
    </div>
  `;

  // Standard Chairman Signature Block
  const standardSignatureBlock = `
    <div style="margin-top: auto; padding-top: 25px;">
      <div style="margin-left: 45%; text-align: center; margin-bottom: 25px;">
        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; text-decoration: underline; color: #000;">EFREN V. MEDINA</p>
        <p style="margin: 0; font-size: 13px; font-weight: 500; color: #111;">Punong Barangay</p>
      </div>
      
      <div style="border-top: 1px solid #000; padding-top: 8px; font-size: 11px; font-style: italic; color: #334155; line-height: 1.4;">
        <p style="margin: 0;">Not valid if with erasure and without dry seal.</p>
        <p style="margin: 0;">Valid for (6) months after date of issue.</p>
      </div>
    </div>
  `;

  // 1. FIRST TIME JOB SEEKER (RA 11261) - 2 PAGES
  if (type === 'First Time Job Seeker') {
    return `<div style="font-family: Arial, sans-serif; color: #000; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; background: #fff;">
      <!-- PAGE 1: CERTIFICATE -->
      <div class="print-page" style="page-break-after: always; break-after: page; position: relative; padding-bottom: 20px;">
        ${headerHtml}
        <div class="print-body" style="display: flex; border: 1px solid #000; min-height: 800px;">
          ${sidebarHtml}
          <div style="flex: 1; padding: 35px 25px; text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">Control No: <span style="text-decoration: underline;">${controlNo}</span></p>
              
              <h2 style="text-align: center; margin: 0 0 4px 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">BARANGAY CERTIFICATE</h2>
              <p style="text-align: center; margin: 0 0 25px 0; font-size: 13px; font-weight: 600; color: #334155;">(First Time Jobseekers Assistance Act - RA 11261)</p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                This is to certify that, <strong>${residentName}</strong>, ${age} years old, ${civilStatus}, residing at <strong>${address}</strong> is under the jurisdiction of Barangay 830, Zone 90, District VI, for <span style="text-decoration: underline;">${age || 'Two (2)'} years</span>, is a qualified availee of RA 11261 or the <strong><em>First Time Jobseekers Act of 2019.</em></strong>
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                I further certify that the holder/bearer was informed of his/her rights, including the duties and responsibilities accorded by RA 11261 through the <strong>Oath of Undertaking</strong> he/she has signed and executed in the presence of our Barangay Official.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                Signed this <strong><span style="text-decoration: underline;">${issueDay} day of ${issueMonthYear}</span></strong> in the City of Manila.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8; font-weight: 500;">
                This certification is valid only for <strong>one (1) year</strong> from the issuance.
              </p>
            </div>
            
            <div style="margin-top: auto; padding-top: 25px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px;">
                <div style="width: 45%; text-align: center;">
                  <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; text-decoration: underline;">ELNORA C. GAMIT</p>
                  <p style="margin: 0; font-size: 12px;">Barangay Kagawad</p>
                  <p style="margin: 10px 0 0 0; font-size: 11px; color: #475569;">${fullDateStr}</p>
                </div>
                <div style="width: 45%; text-align: center;">
                  <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; text-decoration: underline;">EFREN V. MEDINA</p>
                  <p style="margin: 0; font-size: 12px;">Punong Barangay</p>
                  <p style="margin: 10px 0 0 0; font-size: 11px; color: #475569;">${fullDateStr}</p>
                </div>
              </div>
              <div style="border-top: 1px solid #000; padding-top: 8px; font-size: 11px; font-style: italic; color: #334155;">
                <p style="margin: 0;">Not valid without official Barangay dry seal.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PAGE 2: OATH OF UNDERTAKING -->
      <div class="print-page" style="position: relative; padding: 30px 40px; border: 1px solid #000; min-height: 850px; box-sizing: border-box; background: #fff;">
        <h2 style="text-align: center; margin: 0 0 5px 0; font-size: 20px; font-weight: bold;">OATH OF UNDERTAKING</h2>
        <h3 style="text-align: center; margin: 0 0 25px 0; font-size: 14px; font-weight: normal; color: #475569;">(Republic Act 11261 - First Time Jobseekers Assistance Act)</h3>

        <p style="text-align: justify; text-indent: 40px; margin: 0 0 15px 0; font-size: 13px; line-height: 1.7;">
          This is to certify that <strong>${residentName}</strong>, ${age} years old, ${civilStatus}, residing at <strong>${address}</strong> is under the jurisdiction of Barangay 830, Zone 90, District VI, for ${age || 'Two (2)'} years, is qualified and availing the benefits of Republic Act 11261, otherwise known as the First Time Jobseekers Act of 2019, do hereby declare, agree, and undertake to abide and be bound by the following:
        </p>

        <ol style="margin: 0 0 20px 20px; padding: 0; font-size: 12.5px; line-height: 1.6;">
          <li style="margin-bottom: 8px;">That this is the first time that I will actively look for a job and therefore requesting that a Barangay Certification be issued in my favor to avail the benefits of the law.</li>
          <li style="margin-bottom: 8px;">That I am aware that the benefits and privilege/s under the said law shall be valid only for one (1) year from the date that the Barangay Certification is issued.</li>
          <li style="margin-bottom: 8px;">That I can avail the benefits of the law only once.</li>
          <li style="margin-bottom: 8px;">That I understand that my personal information shall be included in the Roster/List of First Time Jobseekers and will not be used for any unlawful purpose.</li>
          <li style="margin-bottom: 8px;">That I will inform and/or report to the Barangay personally, through text or other means, or through my family/relatives once I get employed; and</li>
          <li style="margin-bottom: 8px;">That I am not beneficiary of the Job Start Program under R.A. No. 10869 and other laws that give similar exemptions for the documents or transactions exempted under R.A. No. 11261.</li>
          <li style="margin-bottom: 8px;">That if issued the requested Certification, I will not use the same in any fraud, neither falsify nor help and/or assist in the fabrication of the said certification.</li>
          <li style="margin-bottom: 8px;">That this undertaking is made solely for the purpose of obtaining a Barangay Certification consistent with the objective of R.A. No. 11261 and not for any other purpose.</li>
          <li>That I consent to the use of my personal information pursuant to the Data Privacy Act and other applicable laws, rules, and regulations.</li>
        </ol>

        <p style="text-align: left; margin: 0 0 40px 0; font-size: 13px;">
          Signed this <strong>${issueDay} day of ${issueMonthYear}</strong>, in the City of Manila.
        </p>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 30px;">
          <div style="width: 45%; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; text-decoration: underline;">${residentName}</p>
            <p style="margin: 0 0 25px 0; font-size: 12px;">First Time Jobseeker</p>
            
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold;">Witnessed by:</p>
            <p style="margin: 15px 0 4px 0; font-size: 13px; font-weight: bold; text-decoration: underline;">ELNORA C. GAMIT</p>
            <p style="margin: 0; font-size: 12px;">Barangay Kagawad</p>
          </div>
          <div style="width: 45%; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold;">Approved by:</p>
            <p style="margin: 20px 0 4px 0; font-size: 13px; font-weight: bold; text-decoration: underline;">EFREN V. MEDINA</p>
            <p style="margin: 0 0 25px 0; font-size: 12px;">Punong Barangay</p>
            <p style="margin: 0; font-size: 12px; color: #475569;">Date: <span style="text-decoration: underline;">${fullDateStr}</span></p>
          </div>
        </div>
      </div>
    </div>`;
  }

  // 2. BARANGAY CLEARANCE
  if (type === 'Barangay Clearance') {
    return `<div style="font-family: Arial, sans-serif; color: #000; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; background: #fff;">
      <div class="print-page" style="page-break-after: always; break-after: page; position: relative; padding-bottom: 20px;">
        ${headerHtml}
        <div class="print-body" style="display: flex; border: 1px solid #000; min-height: 800px;">
          ${sidebarHtml}
          <div style="flex: 1; padding: 35px 25px; text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">Control No: <span style="text-decoration: underline;">${controlNo}</span></p>
              
              <h2 style="text-align: center; margin: 0 0 15px 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">BARANGAY CLEARANCE</h2>
              
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">TO WHOM IT MAY CONCERN:</p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                This is to certify that <strong>${residentName}</strong>, ${age} years old, ${civilStatus}, ${nationality}, residing at <strong>${address}</strong>, is a bona-fide resident of Barangay 830, Zone 90, District VI, City of Manila.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                This further certifies that the above-named person is personally known to me to be of <strong>good moral character</strong>, a peaceful and law-abiding citizen, and has <strong>NO DEROGATORY RECORD</strong> or pending criminal charges filed against ${himHer} in this office.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
                This clearance is being issued upon the request of the interested party for <strong>${purposeUpper || 'LOCAL EMPLOYMENT / ID APPLICATION'}</strong> and for whatever legal purpose it may serve ${himHer} best.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 25px 0; font-size: 14px; line-height: 1.8;">
                Issued this <strong>${issueDay} day of ${issueMonthYear}</strong> at the Barangay 830 Hall, Zone 90, District VI, City of Manila.
              </p>
            </div>
            
            ${standardSignatureBlock}
          </div>
        </div>
      </div>
    </div>`;
  }

  // 3. CERTIFICATE OF INDIGENCY
  if (type === 'Certificate of Indigency') {
    return `<div style="font-family: Arial, sans-serif; color: #000; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; background: #fff;">
      <div class="print-page" style="page-break-after: always; break-after: page; position: relative; padding-bottom: 20px;">
        ${headerHtml}
        <div class="print-body" style="display: flex; border: 1px solid #000; min-height: 800px;">
          ${sidebarHtml}
          <div style="flex: 1; padding: 35px 25px; text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">Control No: <span style="text-decoration: underline;">${controlNo}</span></p>
              
              <h2 style="text-align: center; margin: 0 0 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">CERTIFICATE OF INDIGENCY</h2>
              
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">TO WHOM IT MAY CONCERN:</p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                This is to certify that <strong>${residentName}</strong>, ${age} years old, ${civilStatus}, residing at <strong>${address}</strong> is a Bonafide resident of Barangay 830, Zone 90, District VI, Manila.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                This further certifies that ${heShe} belongs to the many indigent families living in this Barangay and is considered one among the families living below the poverty line or indigent families and a low-income earner.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                ${heSheUpper} is personally known to have good moral Character and without any derogatory record on file.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
                This certificate is issued to subject individual for ${hisHer} application for <strong>${purposeUpper || 'FINANCIAL ASSISTANCE / MEDICAL ASSISTANCE'}</strong> and for whatever legal purpose it may serve ${himHer} best.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 25px 0; font-size: 14px; line-height: 1.8;">
                Issued this <strong>${issueDay} day of ${issueMonthYear}</strong> at the Barangay 830 Hall, Zone 90, District VI, City of Manila.
              </p>
            </div>
            
            ${standardSignatureBlock}
          </div>
        </div>
      </div>
    </div>`;
  }

  // 4. CERTIFICATE OF RESIDENCY
  if (type === 'Certificate of Residency') {
    return `<div style="font-family: Arial, sans-serif; color: #000; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; background: #fff;">
      <div class="print-page" style="page-break-after: always; break-after: page; position: relative; padding-bottom: 20px;">
        ${headerHtml}
        <div class="print-body" style="display: flex; border: 1px solid #000; min-height: 800px;">
          ${sidebarHtml}
          <div style="flex: 1; padding: 35px 25px; text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">Control No: <span style="text-decoration: underline;">${controlNo}</span></p>
              
              <h2 style="text-align: center; margin: 0 0 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">CERTIFICATE OF RESIDENCY</h2>
              
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">To whom it may concern:</p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                This is to certify that <strong>${residentName}</strong>, ${age} years old, ${civilStatus}, presently residing at <strong>${address}</strong> is a Bonafide resident of Barangay 830 Zone 90, District VI City of Manila.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                This further certifies that ${heShe} has been permanently residing in this jurisdiction and is known in the community to be of good moral character, law-abiding, and peaceful resident.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
                This certification is issued upon request of the above-named individual for <strong>${purposeUpper || 'PROOF OF RESIDENCY'}</strong> and for whatever legal purpose it may serve ${himHer} best.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 25px 0; font-size: 14px; line-height: 1.8;">
                Issued this <strong>${issueDay} day of ${issueMonthYear}</strong> at the Barangay 830 Hall, Zone 90, District VI, City of Manila.
              </p>
            </div>
            
            ${standardSignatureBlock}
          </div>
        </div>
      </div>
    </div>`;
  }

  // 5. GOOD MORAL FOR AFP / PNP
  if (type === 'Good moral for AFP/PNP') {
    return `<div style="font-family: Arial, sans-serif; color: #000; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; background: #fff;">
      <div class="print-page" style="page-break-after: always; break-after: page; position: relative; padding-bottom: 20px;">
        ${headerHtml}
        <div class="print-body" style="display: flex; border: 1px solid #000; min-height: 800px;">
          ${sidebarHtml}
          <div style="flex: 1; padding: 35px 25px; text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">Control No: <span style="text-decoration: underline;">${controlNo}</span></p>
              
              <h2 style="text-align: center; margin: 0 0 4px 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">CERTIFICATION</h2>
              <p style="text-align: center; margin: 0 0 20px 0; font-size: 13px; font-weight: bold; color: #475569;">(BARANGAY CLEARANCE & GOOD MORAL STANDING)</p>
              
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">TO WHOM IT MAY CONCERN:</p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                This is to certify that, <strong>${residentName}</strong>, of legal age, ${age} years old, ${civilStatus}, known to be a resident of this Barangay with postal address at <strong>${address}</strong>.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                <strong>${residentName}</strong> is known to me to be of good moral character and a law-abiding citizen and no derogatory record in this barangay.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                This is to certify further that the subject person mentioned above and ${hisHer} immediate family members/relatives are <strong>not involved in any illegal activities, not listed in BADAC Watchlist of drug personalities and not connected nor members of any left leaning group/organization</strong>.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
                This certification is being issued upon the request of the interested party for ${hisHer} <strong>${purposeUpper || 'AFP / PNP APPLICATION / RECRUITMENT'}</strong> and for whatever legal purposes it may serve ${himHer} best.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 25px 0; font-size: 14px; line-height: 1.8;">
                Issued this <strong>${issueDay} day of ${issueMonthYear}</strong> at the Barangay 830 Hall, Zone 90, District VI, City of Manila.
              </p>
            </div>
            
            ${standardSignatureBlock}
          </div>
        </div>
      </div>
    </div>`;
  }

  // 6. GOOD MORAL FOR EDUCATION
  if (type === 'Good moral for education') {
    return `<div style="font-family: Arial, sans-serif; color: #000; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; background: #fff;">
      <div class="print-page" style="page-break-after: always; break-after: page; position: relative; padding-bottom: 20px;">
        ${headerHtml}
        <div class="print-body" style="display: flex; border: 1px solid #000; min-height: 800px;">
          ${sidebarHtml}
          <div style="flex: 1; padding: 35px 25px; text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">Control No: <span style="text-decoration: underline;">${controlNo}</span></p>
              
              <h2 style="text-align: center; margin: 0 0 4px 0; font-size: 22px; font-weight: bold; letter-spacing: 1px;">CERTIFICATE OF GOOD MORAL CHARACTER</h2>
              <p style="text-align: center; margin: 0 0 20px 0; font-size: 13px; font-weight: 600; color: #475569;">(FOR ACADEMIC & SCHOLARSHIP REQUIREMENTS)</p>
              
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">TO WHOM IT MAY CONCERN:</p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                This is to certify that <strong>${residentName}</strong>, ${age} years old, ${civilStatus}, Filipino, residing at <strong>${address}</strong> is a bona fide resident of Barangay 830, Zone 90, District VI, City of Manila.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
                This further certifies that the subject student/individual is personally known to me to be a person of <strong>exemplary good moral character</strong>, law-abiding, with a reputation for integrity and diligence, and has <strong>no derogatory record</strong> or behavioral complaint on file in this office.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
                This certification is issued upon the request of the above-named student/applicant for <strong>${purposeUpper || 'EDUCATIONAL ENROLLMENT / SCHOLARSHIP REQUIREMENTS'}</strong> and for whatever legal purpose it may serve ${himHer} best.
              </p>
              
              <p style="text-align: justify; text-indent: 40px; margin: 0 0 25px 0; font-size: 14px; line-height: 1.8;">
                Issued this <strong>${issueDay} day of ${issueMonthYear}</strong> at the Barangay 830 Hall, Zone 90, District VI, City of Manila.
              </p>
            </div>
            
            ${standardSignatureBlock}
          </div>
        </div>
      </div>
    </div>`;
  }

  // 7. BARANGAY ID
  if (type === 'Barangay ID') {
    return `<div style="font-family: Arial, sans-serif; color: #000; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; background: #fff;">
      <div class="print-page" style="page-break-after: always; break-after: page; position: relative; padding-bottom: 20px;">
        ${headerHtml}
        <div class="print-body" style="display: flex; border: 1px solid #000; min-height: 800px;">
          ${sidebarHtml}
          <div style="flex: 1; padding: 30px 22px; text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <p style="margin: 0 0 15px 0; font-size: 13px; font-weight: bold;">Control No: <span style="text-decoration: underline;">${controlNo}</span></p>
              
              <h2 style="text-align: center; margin: 0 0 4px 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">BARANGAY CERTIFICATE</h2>
              <p style="text-align: center; margin: 0 0 15px 0; font-size: 12px; font-weight: 600; color: #475569;">(BARANGAY IDENTIFICATION & RESIDENCY)</p>
              
              <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold;">TO WHOM IT MAY CONCERN:</p>
              
              <p style="text-align: justify; text-indent: 30px; margin: 0 0 14px 0; font-size: 13.5px; line-height: 1.6;">
                THIS IS TO CERTIFY that the individual whose picture and details appear below is a Bonafide resident of Barangay 830, Zone 90 District VI, City of Manila, with verified records on file in this office;
              </p>

              <div style="border: 2px solid #0f172a; border-radius: 6px; padding: 12px 16px; margin: 12px 0; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1; font-size: 12.5px; line-height: 1.8; color: #0f172a;">
                  <p style="margin: 0;"><strong>FULL NAME:</strong> <span style="text-decoration: underline; font-weight: bold;">${residentName}</span></p>
                  <p style="margin: 0;"><strong>AGE / CIVIL STATUS:</strong> ${age} years old / ${civilStatus}</p>
                  <p style="margin: 0;"><strong>NATIONALITY:</strong> ${nationality}</p>
                  <p style="margin: 0;"><strong>ADDRESS:</strong> ${address}</p>
                  <p style="margin: 0;"><strong>PURPOSES:</strong> ${purposeUpper || 'BARANGAY ID APPLICATION'}</p>
                </div>
                <div style="width: 100px; height: 100px; border: 2px dashed #64748b; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; text-align: center; font-size: 10px; color: #475569; font-weight: bold; margin-left: 12px; flex-shrink: 0;">
                  <span>2X2</span>
                  <span>PHOTO</span>
                  <span style="font-size: 8px; font-weight: normal; color: #94a3b8;">ATTACH HERE</span>
                </div>
              </div>
              
              <p style="text-align: justify; text-indent: 30px; margin: 0 0 12px 0; font-size: 13.5px; line-height: 1.6;">
                THIS IS TO FURTHER CERTIFY that according to records on file, the aforementioned individual is a peaceful, law-abiding citizen with no derogatory record in this community.
              </p>
              
              <p style="text-align: justify; text-indent: 30px; margin: 0 0 12px 0; font-size: 13.5px; line-height: 1.6;">
                THIS CERTIFICATE is being issued upon the request of the above-named resident specifically for <strong>${purposeUpper || 'BARANGAY ID / LEGAL PURPOSES'}</strong> and for whatever legal intent or assistance it may serve.
              </p>
              
              <p style="text-align: justify; text-indent: 30px; margin: 0 0 20px 0; font-size: 13.5px; line-height: 1.6;">
                Given this <strong>${issueDay} day of ${issueMonthYear}</strong> at the Office of the Punong Barangay, Barangay 830 Hall, Zone 90, District VI, City of Manila.
              </p>
            </div>
            
            <div style="margin-top: auto; padding-top: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px;">
                <div style="width: 45%; text-align: center;">
                  <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 4px;"></div>
                  <p style="margin: 0; font-size: 12px; font-weight: bold;">Resident's Signature</p>
                </div>
                <div style="width: 45%; text-align: center;">
                  <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; text-decoration: underline;">EFREN V. MEDINA</p>
                  <p style="margin: 0; font-size: 12px;">Punong Barangay</p>
                </div>
              </div>
              <div style="border-top: 1px solid #000; padding-top: 8px; font-size: 11px; font-style: italic; color: #334155;">
                <p style="margin: 0;">Not valid if with erasure and without dry seal.</p>
                <p style="margin: 0;">Valid for (6) months after date of issue.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // 8. BARANGAY CERTIFICATE (WITH SMART DETECTION)
  const pCheck = purpose.toLowerCase();
  let certSubtitle = '';
  let certBodyParagraphs = '';

  if (pCheck.includes('solo parent') || pCheck.includes('ra 8972') || pCheck.includes('solo')) {
    certSubtitle = `(Solo Parent Welfare Act - RA 8972)`;
    certBodyParagraphs = `
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
        This is to certify that, <strong>${residentName}</strong>, ${age} years old, ${civilStatus}, residing at <strong>${address}</strong> is known as stated by the law RA 8972 also known as <strong><em>"Solo Parent Welfare Act Section No. 3, (a)."</em></strong>
      </p>
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
        As foregoing statement by subject individual and intent for the purpose for <strong>REGISTRATION / RENEWAL OF SOLO PARENT ID</strong> at Manila Department of Social Welfare District Welfare Office VI.
      </p>
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
        This certification is issued upon request of the above-named person for ${hisHer} application and for whatever legal purpose it may serve ${himHer} best.
      </p>
    `;
  } else if (pCheck.includes('pwd') || pCheck.includes('disability')) {
    certSubtitle = `(PWD ID Application / Updating)`;
    certBodyParagraphs = `
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
        This is to certify that <strong>${residentName}</strong>, ${age} years old, ${civilStatus}, residing at <strong>${address}</strong> is a Bonafide resident of Barangay 830 Zone 90, District VI City of Manila.
      </p>
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
        As foregoing statement by subject individual and intent for the purpose for <strong>PWD ID APPLICATION / UPDATING</strong> at Manila Department of Social Welfare District Welfare Office VI.
      </p>
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
        This certification is issued upon request of the above-named individual and for whatever legal purpose it may serve ${himHer} best.
      </p>
    `;
  } else if (pCheck.includes('unemploy') || pCheck.includes('jobless') || pCheck.includes('no income')) {
    certSubtitle = `(CERTIFICATE OF UNEMPLOYMENT)`;
    certBodyParagraphs = `
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
        This is to certify that, <strong>${residentName}</strong>, ${age} years old, ${civilStatus}, is a resident of this Barangay and presently residing at <strong>${address}</strong>. That the above-mentioned person is currently unemployed and has no regular income.
      </p>
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
        This certification is issued upon the request of the above-named person for <strong>${purposeUpper || 'SCHOLARSHIP / FINANCIAL REQUIREMENTS'}</strong> and for whatever legal purpose it may serve ${himHer} best.
      </p>
    `;
  } else if (pCheck.includes('close') || pCheck.includes('closure') || pCheck.includes('retire') || pCheck.includes('no business')) {
    certSubtitle = `(BUSINESS CLOSURE / CESSATION OF OPERATIONS)`;
    certBodyParagraphs = `
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
        This is to certify that <strong>${residentName}</strong>, of legal age, is a resident / registered stall owner located at <strong>${address}</strong> within the Jurisdiction of Barangay 830, Zone 90, District VI, City of Manila.
      </p>
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
        Further certifies that said business / establishment is already <strong>CLOSED / CEASED OPERATIONS</strong>.
      </p>
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
        This certification is issued upon the request of the above-named person for ${hisHer} application to close the business at the City of Manila Permit Section and for whatever legal purpose it may serve ${himHer} best.
      </p>
    `;
  } else {
    certSubtitle = purposeUpper ? `(${purposeUpper})` : '';
    certBodyParagraphs = `
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
        This is to certify that <strong>${residentName}</strong>, ${age} years old, ${civilStatus}, presently residing at <strong>${address}</strong> is a Bonafide resident of Barangay 830 Zone 90, District VI City of Manila.
      </p>
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8;">
        This further certifies that ${heShe} is known in the community to be of good moral character, law-abiding, and a peaceful resident with no derogatory record in this barangay.
      </p>
      <p style="text-align: justify; text-indent: 40px; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
        This certification is issued upon request of the above-named individual for <strong>${purposeUpper || 'WHATEVER LEGAL PURPOSE IT MAY SERVE'}</strong>.
      </p>
    `;
  }

  return `<div style="font-family: Arial, sans-serif; color: #000; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; background: #fff;">
    <div class="print-page" style="page-break-after: always; break-after: page; position: relative; padding-bottom: 20px;">
      ${headerHtml}
      <div class="print-body" style="display: flex; border: 1px solid #000; min-height: 800px;">
        ${sidebarHtml}
        <div style="flex: 1; padding: 35px 25px; text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">Control No: <span style="text-decoration: underline;">${controlNo}</span></p>
            
            <h2 style="text-align: center; margin: 0 0 4px 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">BARANGAY CERTIFICATE</h2>
            ${certSubtitle ? `<p style="text-align: center; margin: 0 0 20px 0; font-size: 13px; font-weight: 600; color: #475569;">${certSubtitle}</p>` : '<div style="margin-bottom: 20px;"></div>'}
            
            <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: bold;">TO WHOM IT MAY CONCERN:</p>
            
            ${certBodyParagraphs}
            
            <p style="text-align: justify; text-indent: 40px; margin: 0 0 25px 0; font-size: 14px; line-height: 1.8;">
              Issued this <strong>${issueDay} day of ${issueMonthYear}</strong> at the Barangay 830 Hall, Zone 90, District VI, City of Manila.
            </p>
          </div>
          
          ${standardSignatureBlock}
        </div>
      </div>
    </div>
  </div>`;
};

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  // Flux Notification Bar State
  const [notification, setNotification] = useState(null) // { id, message, type: 'success'|'error'|'warning'|'info', duration }
  const notificationTimeoutRef = useRef(null)

  const showNotification = useCallback((message, type = 'success', duration = 4000) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
    const id = Date.now()
    setNotification({ id, message, type, duration })
    if (duration > 0) {
      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(prev => (prev?.id === id ? null : prev))
      }, duration)
    }
  }, [])

  const dismissNotification = useCallback(() => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
    setNotification(null)
  }, [])

  const [admin, setAdmin] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [certificateRequests, setCertificateRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestLoading, setRequestLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('residents')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [requestSearchTerm, setRequestSearchTerm] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('All')
  const [pendingRegSearchTerm, setPendingRegSearchTerm] = useState('')
  const [pendingUpdSearchTerm, setPendingUpdSearchTerm] = useState('')
  const [pendingRegSortOrder, setPendingRegSortOrder] = useState('newest')
  const [pendingUpdSortOrder, setPendingUpdSortOrder] = useState('newest')
  const [selectedResident, setSelectedResident] = useState(null)
  const [pendingRegistrations, setPendingRegistrations] = useState([])
  const [pendingUpdates, setPendingUpdates] = useState([])
  const [archivedAccounts, setArchivedAccounts] = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [editorContent, setEditorContent] = useState('')
  const [editorVerification, setEditorVerification] = useState('Not Verified')
  const [editorProcess, setEditorProcess] = useState('In process')
  const [editorPdfFile, setEditorPdfFile] = useState(null)
  const [removePdf, setRemovePdf] = useState(false)
  const [existingPdf, setExistingPdf] = useState(null)
  const [editorMode, setEditorMode] = useState('text')
  const [visibleToResident, setVisibleToResident] = useState('text')
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [activeRibbonTab, setActiveRibbonTab] = useState('Home')
  const [pageOrientation, setPageOrientation] = useState('portrait')
  const [pageMargins, setPageMargins] = useState('normal')
  const [pageBorder, setPageBorder] = useState('none')
  const [pageWatermark, setPageWatermark] = useState(false)
  const [pageLineHeight, setPageLineHeight] = useState('1.6')
  const [isSavingCertificate, setIsSavingCertificate] = useState(false)
  const [editorClaimedAt, setEditorClaimedAt] = useState('')
  const [analyticsYear, setAnalyticsYear] = useState('All')
  const [analyticsMonth, setAnalyticsMonth] = useState('All')
  const [showExtractModal, setShowExtractModal] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [attachedImages, setAttachedImages] = useState([])
  const [selectedImageId, setSelectedImageId] = useState(null)
  const [selectedTemplateName, setSelectedTemplateName] = useState('')

  const handleApplyTemplate = (templateName) => {
    if (!selectedRequest || !templateName) return;
    const newHtml = getCertificateTemplate(selectedRequest, templateName);
    const parsed = parseDocumentAndImages(newHtml);
    setEditorContent(parsed.cleanContent);
    if (parsed.images && parsed.images.length > 0) {
      setAttachedImages(parsed.images);
    }
    setSelectedTemplateName(templateName);
  };
  const imageFileInputRef = useRef(null)

  const handleImageFileUpload = (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const newImg = {
        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: file.name.replace(/\.[^/.]+$/, ""),
        src: event.target.result,
        x: 80,
        y: 100,
        width: 160,
        layer: 'front',
        opacity: 1
      };
      setAttachedImages(prev => [...prev, newImg]);
      setSelectedImageId(newImg.id);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const addPresetImage = (src, name, layer = 'front', opacity = 1, width = 120, x = 60, y = 60) => {
    const newImg = {
      id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name,
      src: src,
      x: x,
      y: y,
      width: width,
      layer: layer,
      opacity: opacity
    };
    setAttachedImages(prev => [...prev, newImg]);
    setSelectedImageId(newImg.id);
  };

  const addOfficialSealStamp = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <circle cx="100" cy="100" r="94" fill="none" stroke="#dc2626" stroke-width="4" stroke-dasharray="6,3"/>
      <circle cx="100" cy="100" r="86" fill="none" stroke="#dc2626" stroke-width="2"/>
      <circle cx="100" cy="100" r="62" fill="none" stroke="#dc2626" stroke-width="1.5"/>
      <path id="curveTop" d="M 25 100 A 75 75 0 0 1 175 100" fill="none"/>
      <path id="curveBottom" d="M 175 100 A 75 75 0 0 1 25 100" fill="none"/>
      <text font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#dc2626" letter-spacing="2">
        <textPath href="#curveTop" startOffset="50%" text-anchor="middle">BARANGAY 830 ZONE 90</textPath>
      </text>
      <text font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#dc2626" letter-spacing="1.5">
        <textPath href="#curveBottom" startOffset="50%" text-anchor="middle">CITY OF MANILA • OFFICIAL SEAL</textPath>
      </text>
      <polygon points="100,68 104,80 116,80 106,88 110,100 100,92 90,100 94,88 84,80 96,80" fill="#dc2626"/>
      <text x="100" y="118" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#dc2626">OFFICIAL</text>
      <text x="100" y="132" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#dc2626">DOCUMENT</text>
    </svg>`;
    const src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    addPresetImage(src, 'Official Seal', 'behind', 0.45, 170, 320, 350);
  };

  const updateAttachedImage = (id, updates) => {
    setAttachedImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const deleteAttachedImage = (id) => {
    setAttachedImages(prev => prev.filter(img => img.id !== id));
    if (selectedImageId === id) setSelectedImageId(null);
  };

  const insertOfficialHeader = () => {
    const html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 15px;">
        <div style="width: 90px; height: 90px; display: flex; align-items: center; justify-content: center;">
          <img src="/logo_brgy.png" alt="Brgy Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
        <div style="flex: 1; text-align: center; line-height: 1.3;">
          <div style="display: flex; justify-content: center; margin-bottom: 4px;">
            <img src="/logo_manila.png" alt="City of Manila Seal" style="width: 50px; height: 50px; object-fit: contain;" />
          </div>
          <p style="margin: 0; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Republic of the Philippines</p>
          <p style="margin: 0; font-size: 11px; font-weight: 500; text-transform: uppercase;">City of Manila</p>
          <p style="margin: 1px 0; font-size: 14px; font-weight: bold; letter-spacing: 0.5px; color: #0f172a;">Barangay 830, Zone 90, District VI</p>
          <p style="margin: 0; font-size: 11px; color: #334155;">South Nagtahan, Paco, Manila</p>
          <p style="margin: 0; font-size: 10.5px; color: #334155;">Email: <a href="mailto:barangay830zone90@gmail.com" style="color: #1d4ed8; text-decoration: underline;">barangay830zone90@gmail.com</a> | Tel #: 8275-2818</p>
        </div>
        <div style="width: 90px; height: 90px; display: flex; align-items: center; justify-content: center;">
          <img src="/logo_bagong_pilipinas.png" alt="Bagong Pilipinas" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
      </div>
    `;
    document.execCommand('insertHTML', false, html);
  };

  const insertSignatureBlock = () => {
    const html = `
      <div style="margin-top: 35px; display: flex; justify-content: flex-end; width: 100%;">
        <div style="text-align: center; width: 230px;">
          <p style="margin: 0; font-size: 13px; font-weight: bold; text-decoration: underline; text-transform: uppercase; color: #000;">EFREN V. MEDINA</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #334155;">PUNONG BARANGAY</p>
        </div>
      </div>
    `;
    document.execCommand('insertHTML', false, html);
  };

  const insertOfficialStamp = () => {
    addOfficialSealStamp();
  };

  const handlePrintDocument = () => {
    const printWindow = window.open('', '', 'width=850,height=1000');
    printWindow.document.write('<html><head><title>Print Certificate</title><style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { size: A4; margin: 15mm; } .print-page { height: 95vh !important; max-height: 95vh !important; display: flex; flex-direction: column; overflow: hidden; position: relative; } .word-a4-page { position: relative; } .print-body { flex: 1; } .word-attached-images-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; } .word-floating-image-render { position: absolute; } }</style></head><body style="margin: 0; padding: 20px; position: relative;">');
    printWindow.document.write(compileDocumentWithImages(editorContent, attachedImages));
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getAdminToken = () => {
    try {
      const stored = localStorage.getItem('adminUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.token || '';
      }
    } catch {
      return '';
    }
    return '';
  };

  const adminFetch = async (url, options = {}) => {
    const token = getAdminToken();
    const headers = new Headers(options.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
    if (response.status === 401 || response.status === 403) {
      console.warn(`Admin request to ${url} unauthorized (${response.status})`);
      if (url.startsWith('/api/') && !url.includes('/api/logout') && !url.includes('/api/admin/logout')) {
        setAuthError(true);
      }
    } else if (response.ok) {
      setAuthError(false);
    }
    return response;
  };

  // CSV Extraction Helpers
  const downloadCSV = (filename, csvContent) => {
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const extractCertificateRequestsCSV = (requestsToExport = certificateRequests, customSuffix = 'all') => {
    const headers = [
      'Request ID',
      'Tracking Code',
      'Resident Name',
      'Resident Email',
      'Age',
      'Civil Status',
      'Home Address',
      'Certificate Type',
      'Requested Date',
      'Claimed Date',
      'Verification Status',
      'Process Status'
    ];

    const rows = (Array.isArray(requestsToExport) ? requestsToExport : []).map(r => [
      r.id,
      r.tracking_code || 'N/A',
      r.full_name || r.resident_name || 'Unknown',
      r.resident_email || r.email || 'N/A',
      r.age ?? 'N/A',
      r.civil_status || 'N/A',
      r.address || r.home_address || 'N/A',
      r.certificate_type || 'N/A',
      r.request_date ? new Date(r.request_date).toLocaleString('en-US') : (r.created_at ? new Date(r.created_at).toLocaleString('en-US') : 'N/A'),
      r.claimed_at ? new Date(r.claimed_at).toLocaleString('en-US') : (r.process_status === 'Claimed' ? 'Claimed' : 'Not Claimed'),
      r.verification_status || 'Not Verified',
      r.process_status || 'In process'
    ]);

    const csv = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(`Barangay830_Certificate_Requests_${customSuffix}_${dateStr}.csv`, csv);
  };

  const extractResidentsCSV = (residentsToExport = accounts, customSuffix = 'masterlist') => {
    const headers = [
      'Resident ID',
      'Full Name',
      'Nickname',
      'Age',
      'Gender',
      'Date of Birth',
      'Civil Status',
      'Religion',
      'Home Address',
      'Area',
      'Barangay',
      'City / Municipality',
      'Mobile Phone',
      'Email',
      'Verification Status',
      'Registered Date'
    ];

    const rows = (Array.isArray(residentsToExport) ? residentsToExport : []).map(acc => [
      acc.id,
      acc.full_name || 'N/A',
      acc.nickname || '',
      acc.age ?? 'N/A',
      acc.gender || 'N/A',
      acc.date_of_birth ? new Date(acc.date_of_birth).toLocaleDateString('en-US') : 'N/A',
      acc.civil_status || 'N/A',
      acc.religion || 'N/A',
      acc.home_address || 'N/A',
      acc.area || 'N/A',
      acc.barangay || 'Barangay 830',
      acc.city_municipality || 'City of Manila',
      acc.mobile_phone || 'N/A',
      acc.email || 'N/A',
      acc.is_verified || 'Approved',
      acc.created_at ? new Date(acc.created_at).toLocaleString('en-US') : 'N/A'
    ]);

    const csv = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(`Barangay830_Resident_Masterlist_${customSuffix}_${dateStr}.csv`, csv);
  };

  const extractPendingRegistrationsCSV = () => {
    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Age',
      'Gender',
      'Civil Status',
      'Home Address',
      'Mobile Phone',
      'Status',
      'Submitted Date'
    ];

    const rows = (Array.isArray(pendingRegistrations) ? pendingRegistrations : []).map(p => [
      p.id,
      p.full_name || 'N/A',
      p.email || 'N/A',
      p.age ?? 'N/A',
      p.gender || 'N/A',
      p.civil_status || 'N/A',
      p.home_address || 'N/A',
      p.mobile_phone || 'N/A',
      p.is_verified || 'Pending',
      p.created_at ? new Date(p.created_at).toLocaleString('en-US') : 'N/A'
    ]);

    const csv = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(`Barangay830_Pending_Registrations_${dateStr}.csv`, csv);
  };

  const extractAllRecordsBatch = () => {
    extractCertificateRequestsCSV(certificateRequests, 'all_records');
    setTimeout(() => {
      extractResidentsCSV(accounts, 'masterlist');
    }, 500);
  };

  const handleSaveCertificateDocument = async () => {
    if (!selectedRequest || isSavingCertificate) return;
    setIsSavingCertificate(true);
    try {
      const formData = new FormData();
      formData.append('verification_status', editorVerification);
      formData.append('process_status', editorProcess);
      formData.append('certificate_content', compileDocumentWithImages(editorContent, attachedImages));
      formData.append('visible_to_resident', visibleToResident);
      if (editorProcess === 'Claimed') {
        if (editorClaimedAt) formData.append('claimed_at', editorClaimedAt);
      }
      if (editorPdfFile) formData.append('pdf_file', editorPdfFile);
      if (removePdf) formData.append('remove_pdf', 'true');

      const response = await adminFetch(`/api/request/${selectedRequest.id}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        await fetchRequests();
        setSelectedRequest(null);
        showNotification('Certificate saved successfully!', 'success');
      } else {
        const data = await response.json().catch(() => ({}));
        showNotification(data.message || 'Failed to save certificate document. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error saving certificate:', err);
      showNotification('Network error while saving certificate: ' + err.message, 'error');
    } finally {
      setIsSavingCertificate(false);
    }
  };

  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedChatResident, setSelectedChatResident] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [theme, setTheme] = useState('light')

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const prevCountsRef = React.useRef({ pendingReg: -1, pendingUpd: -1, requests: -1, messages: -1 })
  const hasFetchedRef = React.useRef({ pendingReg: false, pendingUpd: false, requests: false, messages: false })
  
  // Load persisted notifications if they exist
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_notifications');
      if (stored) setNotifications(JSON.parse(stored));
    } catch(e) {}
  }, []);


  const [archiveSubTab, setArchiveSubTab] = useState('residents')
  const [archiveFolders, setArchiveFolders] = useState([])
  const [archiveFiles, setArchiveFiles] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const [residentArchiveFolders, setResidentArchiveFolders] = useState([])
  const [currentResidentFolder, setCurrentResidentFolder] = useState(null)
  const [newResidentFolderName, setNewResidentFolderName] = useState('')
  const [showCreateResidentFolder, setShowCreateResidentFolder] = useState(false)
  const [editingFolderId, setEditingFolderId] = useState(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const messagesEndRef = React.useRef(null)

  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);
    (Array.isArray(accounts) ? accounts : []).forEach(a => {
      if (a.created_at) {
        const y = new Date(a.created_at).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    (Array.isArray(certificateRequests) ? certificateRequests : []).forEach(r => {
      const d = r.request_date || r.created_at;
      if (d) {
        const y = new Date(d).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [accounts, certificateRequests]);

  const monthOptions = [
    { value: 'All', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  const analyticsData = useMemo(() => {
    // 1. Filter accounts and certificate requests according to selected Year & Month
    const filteredAccounts = (Array.isArray(accounts) ? accounts : []).filter(acc => {
      if (!acc.created_at) return analyticsYear === 'All' && analyticsMonth === 'All';
      const d = new Date(acc.created_at);
      if (isNaN(d.getTime())) return false;
      if (analyticsYear !== 'All' && d.getFullYear().toString() !== analyticsYear.toString()) return false;
      if (analyticsMonth !== 'All' && d.getMonth().toString() !== analyticsMonth.toString()) return false;
      return true;
    });

    const filteredRequests = (Array.isArray(certificateRequests) ? certificateRequests : []).filter(req => {
      const rawDate = req.request_date || req.created_at;
      if (!rawDate) return analyticsYear === 'All' && analyticsMonth === 'All';
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;
      if (analyticsYear !== 'All' && d.getFullYear().toString() !== analyticsYear.toString()) return false;
      if (analyticsMonth !== 'All' && d.getMonth().toString() !== analyticsMonth.toString()) return false;
      return true;
    });

    // Summary counts for filtered period
    const totalRequestsCount = filteredRequests.length;
    const totalRegistrationsCount = filteredAccounts.length;
    const claimedRequestsCount = filteredRequests.filter(r => r.process_status === 'Claimed').length;
    const verifiedRequestsCount = filteredRequests.filter(r => r.verification_status === 'Verified').length;
    const claimRate = totalRequestsCount > 0 ? Math.round((claimedRequestsCount / totalRequestsCount) * 100) : 0;

    // 2. Registrations Timeline Chart
    let registrationData = [];
    if (analyticsMonth !== 'All') {
      // Daily breakdown within that specific month
      const daysMap = {};
      const yearNum = analyticsYear === 'All' ? new Date().getFullYear() : parseInt(analyticsYear, 10);
      const monthNum = parseInt(analyticsMonth, 10);
      const daysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        daysMap[`Day ${day}`] = 0;
      }
      filteredAccounts.forEach(acc => {
        const d = new Date(acc.created_at);
        const dayKey = `Day ${d.getDate()}`;
        if (daysMap[dayKey] !== undefined) {
          daysMap[dayKey]++;
        }
      });
      registrationData = Object.keys(daysMap).map(key => ({
        name: key,
        Registrations: daysMap[key]
      }));
    } else if (analyticsYear !== 'All') {
      // Month-by-month for that specific year (Jan - Dec)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthsMap = {};
      monthNames.forEach(m => { monthsMap[m] = 0; });
      filteredAccounts.forEach(acc => {
        const d = new Date(acc.created_at);
        const m = monthNames[d.getMonth()];
        if (monthsMap[m] !== undefined) {
          monthsMap[m]++;
        }
      });
      registrationData = monthNames.map(m => ({
        name: m,
        Registrations: monthsMap[m]
      }));
    } else {
      // All years, all months: aggregate over time
      const registrationsByMonth = (Array.isArray(accounts) ? accounts : []).reduce((acc, account) => {
        const date = new Date(account.created_at);
        if (isNaN(date.getTime())) return acc;
        const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        acc[monthYear] = (acc[monthYear] || 0) + 1;
        return acc;
      }, {});
      registrationData = Object.keys(registrationsByMonth).map(key => ({
        name: key,
        Registrations: registrationsByMonth[key]
      })).sort((a, b) => new Date(a.name) - new Date(b.name)).slice(-12);
    }

    // 3. Certificate Requests Breakdown
    const requestsByType = filteredRequests.reduce((acc, req) => {
      const type = req.certificate_type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const requestTypeData = Object.keys(requestsByType).map(key => ({
      name: key,
      value: requestsByType[key]
    }));

    // 4. Age Demographics
    const accountsForAge = filteredAccounts.length > 0 ? filteredAccounts : (Array.isArray(accounts) ? accounts : []);
    const ageGroups = { '18-25': 0, '26-35': 0, '36-50': 0, '51-65': 0, '65+': 0, 'Unknown': 0 };
    accountsForAge.forEach(account => {
      let age = account.age;
      if (!age && account.date_of_birth) {
        age = new Date().getFullYear() - new Date(account.date_of_birth).getFullYear();
      }
      if (age) {
        if (age >= 18 && age <= 25) ageGroups['18-25']++;
        else if (age >= 26 && age <= 35) ageGroups['26-35']++;
        else if (age >= 36 && age <= 50) ageGroups['36-50']++;
        else if (age >= 51 && age <= 65) ageGroups['51-65']++;
        else if (age > 65) ageGroups['65+']++;
        else ageGroups['Unknown']++;
      } else {
        ageGroups['Unknown']++;
      }
    });
    const ageData = Object.keys(ageGroups).map(key => ({
      name: key,
      Count: ageGroups[key]
    })).filter(data => data.Count > 0);

    // 5. Request Process Status Breakdown (includes Claimed)
    const statusCounts = { 'In process': 0, 'For Pickup': 0, 'Claimed': 0, 'Void': 0 };
    filteredRequests.forEach(req => {
      const st = req.process_status || 'In process';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });
    const statusData = Object.keys(statusCounts).map(key => ({
      name: key,
      Count: statusCounts[key]
    }));

    return { 
      registrationData, 
      requestTypeData, 
      ageData, 
      statusData,
      totalRequestsCount,
      totalRegistrationsCount,
      claimedRequestsCount,
      verifiedRequestsCount,
      claimRate
    };
  }, [accounts, certificateRequests, analyticsYear, analyticsMonth]);
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light'
    setTheme(storedTheme)
    document.documentElement.dataset.theme = storedTheme

    const adminUser = localStorage.getItem('adminUser')
    if (!adminUser) {
      navigate('/admin-login')
    } else {
      const userData = JSON.parse(adminUser)
      setAdmin(userData)
      fetchAccounts()
      fetchRequests()
      fetchConversations()
      fetchPendingRegistrations()
      fetchPendingUpdates()
    }
  }, [navigate])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    localStorage.setItem('theme', nextTheme)
  }

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAccounts()
      fetchRequests()
    }
    if (activeTab === 'requests') fetchRequests()
    if (activeTab === 'residents') fetchAccounts()
    if (activeTab === 'chat') fetchConversations()
    if (activeTab === 'pending') fetchPendingRegistrations()
    if (activeTab === 'updates') fetchPendingUpdates()
    if (activeTab === 'archived') {
      fetchArchivedAccounts()
      if (archiveSubTab === 'files') {
        currentFolder ? fetchArchiveFiles(currentFolder.id) : fetchArchiveFolders()
      } else if (archiveSubTab === 'residents') {
        fetchResidentArchiveFolders()
      }
    }
  }, [activeTab, archiveSubTab, currentFolder, currentResidentFolder])

  useEffect(() => {
    const timer = setInterval(() => {
      // Background polling for all pending data to keep badges "live"
      fetchPendingRegistrations();
      fetchPendingUpdates();
      fetchRequests();
      fetchConversations();
      
      // Update specific chat messages if chat tab is open and resident is selected
      if (activeTab === 'chat' && selectedChatResident) {
        fetchMessages(selectedChatResident.id);
        markAsRead(selectedChatResident.id);
      }
    }, 10000); // Check every 10 seconds
    return () => clearInterval(timer);
  }, [activeTab, selectedChatResident])

  const pendingRegCount = pendingRegistrations.length;
  const pendingUpdCount = pendingUpdates.length;
  const totalRequestsCount = Array.isArray(certificateRequests) ? certificateRequests.length : 0;
  const unreadMessagesCount = Array.isArray(conversations) ? conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) : 0;

  useEffect(() => {
    const prev = prevCountsRef.current;
    const newNotifs = [];

    if (hasFetchedRef.current.pendingReg) {
      if (prev.pendingReg !== -1 && pendingRegCount > prev.pendingReg) newNotifs.push(`New pending registration received!`);
      prev.pendingReg = pendingRegCount;
    }
    if (hasFetchedRef.current.pendingUpd) {
      if (prev.pendingUpd !== -1 && pendingUpdCount > prev.pendingUpd) newNotifs.push(`New profile update request!`);
      prev.pendingUpd = pendingUpdCount;
    }
    if (hasFetchedRef.current.requests) {
      if (prev.requests !== -1 && totalRequestsCount > prev.requests) newNotifs.push(`New certificate request!`);
      prev.requests = totalRequestsCount;
    }
    if (hasFetchedRef.current.messages) {
      if (prev.messages !== -1 && unreadMessagesCount > prev.messages) newNotifs.push(`New unread message!`);
      prev.messages = unreadMessagesCount;
    }

    if (newNotifs.length > 0) {
      setNotifications(prevNotifs => {
        const notifObjects = newNotifs.map(text => ({
          id: Date.now() + Math.random(),
          text,
          time: new Date().toLocaleTimeString(),
          isNew: true
        }));
        const updated = [...notifObjects, ...prevNotifs].slice(0, 50);
        localStorage.setItem('admin_notifications', JSON.stringify(updated));
        return updated;
      });
    }
  }, [pendingRegCount, pendingUpdCount, totalRequestsCount, unreadMessagesCount]);

  const fetchConversations = async () => {
    try {
      const res = await adminFetch('/api/admin/conversations')
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : [])
      hasFetchedRef.current.messages = true;
    } catch (err) {
      console.error('Failed to load conversations', err)
    }
  }

  const fetchMessages = async (userId) => {
    try {
      const res = await adminFetch(`/api/messages/${userId}`)
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedChatResident) return
    try {
      const response = await adminFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedChatResident.id,
          sender: 'admin',
          message_text: replyText
        })
      })
      if (response.ok) {
        setReplyText('')
        fetchMessages(selectedChatResident.id)
        fetchConversations()
      }
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const markAsRead = async (userId) => {
    try {
      await adminFetch(`/api/admin/messages/read/${userId}`, { method: 'PUT' })
      fetchConversations()
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  useEffect(() => {
    if (selectedChatResident) {
      fetchMessages(selectedChatResident.id)
      markAsRead(selectedChatResident.id)
    }
  }, [selectedChatResident])

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  const fetchArchiveFolders = async () => {
    try {
      const res = await adminFetch('/api/admin/archive-folders')
      const data = await res.json()
      setArchiveFolders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load folders:', err)
    }
  }

  const fetchArchiveFiles = async (folderId) => {
    try {
      const res = await adminFetch(`/api/admin/archive-files/${folderId}`)
      const data = await res.json()
      setArchiveFiles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load files:', err)
    }
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    try {
      const res = await adminFetch('/api/admin/archive-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName })
      })
      if (res.ok) {
        setNewFolderName('')
        setShowCreateFolder(false)
        fetchArchiveFolders()
        showNotification('Folder created successfully!', 'success')
      } else {
        const data = await res.json().catch(() => ({}))
        showNotification(data.message || 'Failed to create folder', 'error')
      }
    } catch (err) {
      console.error('Error creating folder:', err)
      showNotification('Error creating folder: ' + err.message, 'error')
    }
  }

  const handleFileUpload = async (e) => {
    if (!e.target.files || !e.target.files[0] || !currentFolder) return
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder_id', currentFolder.id)
    formData.append('uploaded_by', admin.name)

    setUploadingFile(true)
    try {
      const res = await adminFetch('/api/admin/archive-files', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        fetchArchiveFiles(currentFolder.id)
        showNotification('File uploaded successfully!', 'success')
      } else {
        const data = await res.json().catch(() => ({}))
        showNotification(data.message || 'Failed to upload file', 'error')
      }
    } catch (err) {
      console.error('Error uploading file:', err)
      showNotification('Error uploading file: ' + err.message, 'error')
    } finally {
      setUploadingFile(false)
      e.target.value = null
    }
  }

  const handleMoveFileToFolder = async (fileId, folderId) => {
    try {
      const response = await adminFetch('/api/admin/archive-files/move', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, folderId: folderId ? Number(folderId) : null })
      })
      if (response.ok) {
        if (currentFolder) fetchArchiveFiles(currentFolder.id)
        showNotification('Document moved to folder successfully!', 'success')
      } else {
        const data = await response.json().catch(() => ({}))
        showNotification(data.message || 'Failed to move document', 'error')
      }
    } catch (err) {
      console.error('Error moving file:', err)
      showNotification('Error moving document: ' + err.message, 'error')
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await adminFetch('/api/all-accounts')
      const data = await response.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
    }
    setLoading(false)
  }

  const fetchArchivedAccounts = async () => {
    try {
      const response = await adminFetch('/api/admin/archived-residents')
      const data = await response.json()
      setArchivedAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch archived accounts:', err)
    }
  }

  const fetchResidentArchiveFolders = async () => {
    try {
      const res = await adminFetch('/api/admin/resident-archive-folders')
      const data = await res.json()
      setResidentArchiveFolders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load resident folders:', err)
    }
  }

  const fetchRequests = async () => {
    setRequestLoading(true)
    try {
      const res = await adminFetch('/api/all-requests')
      const data = await res.json()
      setCertificateRequests(Array.isArray(data) ? data : [])
      hasFetchedRef.current.requests = true;
    } catch (err) {
      console.error('Failed to fetch requests:', err.message)
      setCertificateRequests([])
    }
    setRequestLoading(false)
  }

  const fetchPendingRegistrations = async () => {
    try {
      const response = await adminFetch('/api/admin/pending-registrations')
      const data = await response.json()
      setPendingRegistrations(Array.isArray(data) ? data : [])
      hasFetchedRef.current.pendingReg = true;
    } catch (err) {
      console.error('Failed to fetch pending registrations:', err)
    }
  }

  const fetchPendingUpdates = async () => {
    try {
      const response = await adminFetch('/api/admin/pending-updates')
      const data = await response.json()
      setPendingUpdates(Array.isArray(data) ? data : [])
      hasFetchedRef.current.pendingUpd = true;
    } catch (err) {
      console.error('Failed to fetch pending updates:', err)
    }
  }

  const handleApproveUpdate = async (requestId) => {
    if (!window.confirm('Approve these profile changes?')) return
    try {
      const response = await adminFetch(`/api/admin/approve-update/${requestId}`, {
        method: 'PUT'
      })
      if (response.ok) {
        showNotification('Profile changes approved and applied!', 'success')
        fetchPendingUpdates()
        fetchAccounts()
      } else {
        const data = await response.json().catch(() => ({}))
        showNotification(data.message || 'Failed to approve update', 'error')
      }
    } catch (err) {
      console.error('Error approving update:', err)
      showNotification('Error approving update: ' + err.message, 'error')
    }
  }

  const handleRejectUpdate = async (requestId) => {
    if (!window.confirm('Reject these profile changes?')) return
    try {
      const response = await adminFetch(`/api/admin/reject-update/${requestId}`, {
        method: 'PUT'
      })
      if (response.ok) {
        showNotification('Update request rejected', 'info')
        fetchPendingUpdates()
      } else {
        const data = await response.json().catch(() => ({}))
        showNotification(data.message || 'Failed to reject update', 'error')
      }
    } catch (err) {
      console.error('Error rejecting update:', err)
      showNotification('Error rejecting update: ' + err.message, 'error')
    }
  }

  const handleApproveResident = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this registration?')) return
    try {
      const response = await adminFetch(`/api/admin/verify-resident/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        showNotification('Resident approved successfully!', 'success')
        fetchPendingRegistrations()
        fetchAccounts()
      } else {
        const data = await response.json().catch(() => ({}))
        showNotification(data.message || 'Failed to approve resident', 'error')
      }
    } catch (err) {
      console.error('Error approving resident:', err)
      showNotification('Error approving resident: ' + err.message, 'error')
    }
  }

  const handleRejectResident = async (userId) => {
    const reason = window.prompt('Enter reason for rejection (optional):')
    if (reason === null) return
    try {
      const response = await adminFetch(`/api/admin/reject-resident/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (response.ok) {
        showNotification('Resident rejected', 'info')
        fetchPendingRegistrations()
      } else {
        const data = await response.json().catch(() => ({}))
        showNotification(data.message || 'Failed to reject resident', 'error')
      }
    } catch (err) {
      console.error('Error rejecting resident:', err)
      showNotification('Error rejecting resident: ' + err.message, 'error')
    }
  }

  const handleApproveAllResidents = async () => {
    if (!window.confirm('Are you sure you want to approve ALL pending registrations?')) return
    try {
      const response = await adminFetch('/api/admin/verify-all-residents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        showNotification('All pending residents approved successfully!', 'success')
        fetchPendingRegistrations()
        fetchAccounts()
      } else {
        const data = await response.json().catch(() => ({}))
        showNotification(data.message || 'Failed to approve all residents', 'error')
      }
    } catch (err) {
      console.error('Error approving all residents:', err)
      showNotification('Error approving all residents: ' + err.message, 'error')
    }
  }

  const refreshAll = () => {
    fetchAccounts();
    fetchRequests();
    fetchConversations();
    fetchPendingRegistrations();
    fetchPendingUpdates();
    if (activeTab === 'archived') {
      fetchArchivedAccounts();
      if (archiveSubTab === 'files') {
        currentFolder ? fetchArchiveFiles(currentFolder.id) : fetchArchiveFolders()
      } else if (archiveSubTab === 'residents') {
        fetchResidentArchiveFolders();
      }
    }
  }

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } catch(e) {}
    localStorage.removeItem('adminUser')
    navigate('/admin-login')
  }

  const handleRemovePhoto = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this photo?')) return;
    try {
      const response = await adminFetch(`/api/admin/remove-photo/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showNotification('Photo removed successfully', 'success');
        fetchAccounts();
      } else {
        const data = await response.json().catch(() => ({}));
        showNotification(data.message || 'Failed to remove photo', 'error');
      }
    } catch (err) {
      console.error('Error removing photo:', err);
      showNotification('Error removing photo: ' + err.message, 'error');
    }
  };

  const handleUpdatePhoto = async (userId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await adminFetch(`/api/user/${userId}`, {
        method: 'PUT',
        body: formData
      });
      if (response.ok) {
        showNotification('Photo updated successfully', 'success');
        fetchAccounts();
      } else {
        const data = await response.json().catch(() => ({}));
        showNotification(data.message || 'Failed to update photo', 'error');
      }
    } catch (err) {
      console.error('Error updating photo:', err);
      showNotification('Error updating photo: ' + err.message, 'error');
    }
  };

  const handleArchiveResident = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to archive the account for ${name}? Archived accounts are preserved and can be reviewed later.`)) return;

    try {
      const response = await adminFetch(`/api/admin/archive-resident/${userId}`, {
        method: 'PUT'
      });
      const data = await response.json();

      if (response.ok) {
        showNotification('Resident account archived successfully', 'success');
        fetchAccounts();
        if (selectedResident && selectedResident.id === userId) {
          closeResidentDetails();
        }
      } else {
        showNotification(data.message || 'Failed to archive resident', 'error');
      }
    } catch (err) {
      console.error('Error archiving resident:', err);
      showNotification('Error archiving resident: ' + err.message, 'error');
    }
  };

  const openResidentDetails = (account) => {
    console.log("🔍 Opening resident details:", account);
    setSelectedResident(account)
    setActiveTab('residentDetail')
  }

  const closeResidentDetails = () => {
    setSelectedResident(null)
    setActiveTab('residents')
  }

  const handleMessageResident = () => {
    if (!selectedResident) return
    setSelectedChatResident(selectedResident)
    setActiveTab('chat')
  }

  const getProcessStatusClass = (status) => {
    switch (status) {
      case 'Claimed': return 'status-verified';
      case 'Void': return 'status-rejected';
      case 'For Pickup': return 'status-pickup';
      default: return 'status-pending';
    }
  };

  const handleCreateResidentFolder = async (e) => {
    e.preventDefault();
    if (!newResidentFolderName.trim()) return;
    try {
      const response = await adminFetch('/api/admin/resident-archive-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newResidentFolderName })
      });
      if (response.ok) {
        setNewResidentFolderName('');
        setShowCreateResidentFolder(false);
        fetchResidentArchiveFolders();
        showNotification('Folder created successfully!', 'success');
      } else {
        const data = await response.json().catch(() => ({}));
        showNotification(data.message || 'Failed to create folder', 'error');
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      showNotification('Error creating folder: ' + err.message, 'error');
    }
  };

  const handleMoveResidentToFolder = async (residentId, folderId) => {
    try {
      const response = await adminFetch('/api/admin/resident-archive-folders/move', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residentId, folderId })
      });
      if (response.ok) {
        fetchArchivedAccounts();
        showNotification('Resident moved to folder successfully!', 'success');
      } else {
        const data = await response.json().catch(() => ({}));
        showNotification(data.message || 'Failed to move resident', 'error');
      }
    } catch (err) {
      console.error('Error moving resident:', err);
      showNotification('Network error while moving resident: ' + err.message, 'error');
    }
  };

  const handleRenameFolder = async (e, folderId, isResidentFolder) => {
    e.stopPropagation();
    if (!editingFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    try {
      const endpoint = isResidentFolder 
        ? `/api/admin/resident-archive-folders/${folderId}`
        : `/api/admin/archive-folders/${folderId}`;
      
      const res = await adminFetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingFolderName })
      });
      if (res.ok) {
        setEditingFolderId(null);
        if (isResidentFolder) {
          fetchResidentArchiveFolders();
        } else {
          fetchArchiveFolders();
        }
        showNotification('Folder renamed successfully!', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        showNotification(data.message || 'Failed to rename folder', 'error');
      }
    } catch (err) {
      console.error('Error renaming folder:', err);
      showNotification('Error renaming folder: ' + err.message, 'error');
    }
  };

  const startEditingFolder = (e, folder) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  if (loading) return (
    <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div className="loading-spinner"></div>
      <div>Loading Flux Dashboard...</div>
      <div style={{ fontSize: '12px', opacity: 0.7 }}>Checking API connectivity...</div>
    </div>
  )
  
  if (!admin) return <div className="loading-screen">Authenticating Admin...</div>

  // Safety check for stats
  const totalResidents = Array.isArray(accounts) ? accounts.length : 0;

  const filteredAccounts = (Array.isArray(accounts) ? accounts : []).filter(account => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = account?.full_name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = account?.email?.toLowerCase().includes(searchLower) || false;
    
    // Add year-based search for account creation year
    let yearMatch = false;
    if (account?.created_at) {
      const year = new Date(account.created_at).getFullYear().toString();
      if (year.includes(searchLower)) yearMatch = true;
    }

    return nameMatch || emailMatch || yearMatch;
  }).sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (sortOrder === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (sortOrder === 'nameAsc') return (a.full_name || '').localeCompare(b.full_name || '');
    if (sortOrder === 'nameDesc') return (b.full_name || '').localeCompare(a.full_name || '');
    return 0;
  });

  const filteredRequests = (Array.isArray(certificateRequests) ? certificateRequests : []).filter(r => {
    const searchLower = requestSearchTerm.toLowerCase();
    const matchesSearch = (r.full_name || r.resident_name || '').toLowerCase().includes(searchLower) || 
                          (r.certificate_type || '').toLowerCase().includes(searchLower);
    
    if (requestStatusFilter === 'All') return matchesSearch;
    
    const searchStatus = requestStatusFilter.toLowerCase();
    const verifyStatus = (r.verification_status || '').toLowerCase();
    const processStatus = (r.process_status || '').toLowerCase();
    
    // "Void" translates to "Not Valid" in the database/UI options
    const isVoidMatch = searchStatus === 'void' && verifyStatus === 'not valid';
    
    return matchesSearch && (verifyStatus === searchStatus || processStatus === searchStatus || isVoidMatch);
  });

  const filteredArchivedAccounts = (Array.isArray(archivedAccounts) ? archivedAccounts : []).filter(account => {
    const nameMatch = account?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const emailMatch = account?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    return nameMatch || emailMatch
  })

  const filteredPendingRegistrations = (Array.isArray(pendingRegistrations) ? pendingRegistrations : []).filter(resident => {
    const searchLower = pendingRegSearchTerm.toLowerCase();
    const nameMatch = resident?.full_name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = resident?.email?.toLowerCase().includes(searchLower) || false;
    const genderMatch = resident?.gender?.toLowerCase().includes(searchLower) || false;
    const ageMatch = resident?.age?.toString().includes(searchLower) || false;
    return nameMatch || emailMatch || genderMatch || ageMatch;
  }).sort((a, b) => {
    if (pendingRegSortOrder === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (pendingRegSortOrder === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (pendingRegSortOrder === 'nameAsc') return (a.full_name || '').localeCompare(b.full_name || '');
    if (pendingRegSortOrder === 'nameDesc') return (b.full_name || '').localeCompare(a.full_name || '');
    return 0;
  });

  const filteredPendingUpdates = (Array.isArray(pendingUpdates) ? pendingUpdates : []).filter(update => {
    const searchLower = pendingUpdSearchTerm.toLowerCase();
    const currentNameMatch = update?.current_name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = update?.resident_email?.toLowerCase().includes(searchLower) || false;
    const requestedNameMatch = update?.full_name?.toLowerCase().includes(searchLower) || false;
    const nicknameMatch = update?.nickname?.toLowerCase().includes(searchLower) || false;
    const addressMatch = update?.home_address?.toLowerCase().includes(searchLower) || false;
    const phoneMatch = update?.mobile_phone?.toLowerCase().includes(searchLower) || false;
    return currentNameMatch || emailMatch || requestedNameMatch || nicknameMatch || addressMatch || phoneMatch;
  }).sort((a, b) => {
    if (pendingUpdSortOrder === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (pendingUpdSortOrder === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (pendingUpdSortOrder === 'nameAsc') return (a.current_name || '').localeCompare(b.current_name || '');
    if (pendingUpdSortOrder === 'nameDesc') return (b.current_name || '').localeCompare(a.current_name || '');
    return 0;
  });

  return (
    <div className="admin-layout">
      {/* Flux Notification Bar (Toast) */}
      {notification && (
        <div className="flux-toast-container" role="region" aria-label="Notifications">
          <div className={`flux-toast-bar flux-toast-${notification.type}`} role="alert">
            <div className="flux-toast-icon">
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
              {notification.type === 'warning' && '⚠'}
              {notification.type === 'info' && 'ℹ'}
            </div>
            <div className="flux-toast-body">
              <div className="flux-toast-title">
                {notification.type === 'success' && 'Success'}
                {notification.type === 'error' && 'Error'}
                {notification.type === 'warning' && 'Warning'}
                {notification.type === 'info' && 'Notice'}
              </div>
              <div className="flux-toast-message">{notification.message}</div>
            </div>
            <button 
              className="flux-toast-close" 
              onClick={dismissNotification}
              aria-label="Close notification"
            >
              ×
            </button>
            {notification.duration > 0 && (
              <div className="flux-toast-progress">
                <div 
                  key={notification.id}
                  className="flux-toast-progress-bar"
                  style={{ animationDuration: `${notification.duration}ms` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="flux-sidebar">
        <div className="sidebar-logo">
          <img src="/logo_brgy.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span className="logo-text">Brgy.830</span>
        </div>
        
        <nav className="sidebar-nav">
          <p className="nav-section-title">Overview</p>
          <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <span className="nav-icon">📈</span>
            <span className="nav-label" style={{ flex: 1 }}>Analytics</span>
          </button>
          <button className={`nav-item ${activeTab === 'residents' ? 'active' : ''}`} onClick={() => setActiveTab('residents')}>
            <span className="nav-icon">👥</span>
            <span className="nav-label" style={{ flex: 1 }}>Residents</span>
          </button>
          <button className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            <span className="nav-icon">⏳</span>
            <span className="nav-label" style={{ flex: 1 }}>Pending Registrations</span>
            {pendingRegistrations.length > 0 && <span className="unread-badge">{pendingRegistrations.length}</span>}
          </button>
          <button className={`nav-item ${activeTab === 'updates' ? 'active' : ''}`} onClick={() => setActiveTab('updates')}>
            <span className="nav-icon">🔄</span>
            <span className="nav-label" style={{ flex: 1 }}>Profile Updates</span>
            {pendingUpdates.length > 0 && <span className="unread-badge">{pendingUpdates.length}</span>}
          </button>
          <button className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            <span className="nav-icon">📜</span>
            <span className="nav-label" style={{ flex: 1 }}>Requests</span>
            {totalRequestsCount > 0 && <span className="unread-badge">{totalRequestsCount}</span>}
          </button>
          <button className={`nav-item ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => setActiveTab('archived')}>
            <span className="nav-icon">🗄️</span>
            <span className="nav-label" style={{ flex: 1 }}>Archived</span>
          </button>
          <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <span className="nav-icon">💬</span>
            <span className="nav-label" style={{ flex: 1 }}>Support Chat</span>
            {unreadMessagesCount > 0 && <span className="unread-badge">{unreadMessagesCount}</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-avatar">{admin.name?.charAt(0)}</div>
          <div className="admin-info-text">
            <p className="admin-name">{admin.name}</p>
            <p className="admin-role">Administrator</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flux-main">
        <header className="flux-header" style={{ justifyContent: 'flex-end', position: 'relative' }}>
          <div className="header-actions">
            <button
              type="button"
              className="logout-flux-btn"
              onClick={() => setShowExtractModal(true)}
              title="Extract All Records to CSV/Excel format"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #185abd 0%, #104897 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: 'bold',
                padding: '8px 14px',
                fontSize: '13px',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(24, 90, 189, 0.25)'
              }}
            >
              <span>📥</span> Extract All Records
            </button>
            <div style={{ position: 'relative' }}>
              <button 
                className="logout-flux-btn" 
                style={{ position: 'relative', padding: '8px 12px', fontSize: '18px' }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {notifications.filter(n => n.isNew).length > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-5px',
                    backgroundColor: 'red', color: 'white', borderRadius: '50%',
                    padding: '2px 6px', fontSize: '12px', fontWeight: 'bold'
                  }}>
                    {notifications.filter(n => n.isNew).length}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '100%', right: '0', marginTop: '10px',
                  width: '300px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000,
                  maxHeight: '400px', overflowY: 'auto'
                }}>
                  <div style={{ padding: '12px 15px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>Notifications</h3>
                    <button 
                      onClick={() => setNotifications(n => {
                        const updated = n.map(x => ({...x, isNew: false}));
                        localStorage.setItem('admin_notifications', JSON.stringify(updated));
                        return updated;
                      })}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div style={{ padding: '10px' }}>
                    {notifications.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: '20px 0' }}>No notifications yet.</p>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} style={{
                          padding: '10px', borderBottom: '1px solid var(--border-color)',
                          backgroundColor: notif.isNew ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                          borderRadius: '4px', marginBottom: '4px'
                        }}>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: notif.isNew ? 'bold' : 'normal' }}>{notif.text}</p>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{notif.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button className="logout-flux-btn" onClick={refreshAll}>🔄 Refresh</button>
            <button className="logout-flux-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>

        <div className="settings-bar">
          <div className="settings-bar-item">
            <span>Theme:</span>
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
        </div>

        {authError && (
          <div style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
            border: '1px solid #ef4444'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Administrator Session Disconnected or Expired</div>
                <div style={{ fontSize: '13px', opacity: 0.95 }}>
                  The server rejected data requests with 401 Unauthorized. Please sign in again to restore live database records.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('adminUser');
                navigate('/admin-login');
              }}
              style={{
                backgroundColor: '#ffffff',
                color: '#b91c1c',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              Sign In to Admin
            </button>
          </div>
        )}

        {/* Welcome Banner */}
        <section className="welcome-banner">
          <div className="banner-content">
            <h1>Good morning, {admin.name} 👋</h1>
            <p>Here's what's happening with Barangay 830 today.</p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card residents">
              <div className="stat-icon">👥</div>
              <div>
                <span className="stat-label">Total Residents</span>
                <span className="stat-value">{totalResidents}</span>
              </div>
              <div className="stat-trend trend-up">
                <span>↑ 12%</span>
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>from last month</span>
              </div>
            </div>
            <div className="stat-card requests">
              <div className="stat-icon">📜</div>
              <div>
                <span className="stat-label">Total Requests</span>
                <span className="stat-value">{totalRequestsCount}</span>
              </div>
              <div className="stat-trend trend-down">
                <span>↓ 5%</span>
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>from yesterday</span>
              </div>
            </div>
            <div className="stat-card messages">
              <div className="stat-icon">💬</div>
              <div>
                <span className="stat-label">Unread Messages</span>
                <span className="stat-value">{unreadMessagesCount}</span>
              </div>
              <div className="stat-trend trend-up">
                <span>↑ 8 new</span>
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>awaiting reply</span>
              </div>
            </div>
            <div className="stat-card verified">
              <div className="stat-icon">✅</div>
              <div>
                <span className="stat-label">Verified Users</span>
                <span className="stat-value">{totalResidents}</span>
              </div>
              <div className="stat-trend trend-up">
                <span>100%</span>
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>compliance</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>⚡ Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            <button className="logout-flux-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', padding: '16px' }} onClick={() => setActiveTab('requests')}>
              <span>➕</span> New Certificate
            </button>
            <button className="logout-flux-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', padding: '16px' }} onClick={() => setActiveTab('chat')}>
              <span>📢</span> Broadcast News
            </button>
            <button className="logout-flux-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', padding: '16px' }} onClick={refreshAll}>
              <span>📊</span> Generate Report
            </button>
          </div>
        </div>

        {selectedPhoto && (
          <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
            <div className="photo-modal-content">
              <img src={selectedPhoto} alt="Full size" />
              <button className="close-photo" onClick={() => setSelectedPhoto(null)}>✕</button>
            </div>
          </div>
        )}

        <div className={`content-container ${activeTab === 'chat' ? 'chat-active' : ''}`}>
          {activeTab === 'residents' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>👥 Registered Residents</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="header-search" style={{ margin: 0 }}>
                    <span className="search-icon">🔍</span>
                    <input 
                      type="text" 
                      className="flux-input"
                      placeholder="Search residents by name, email, or year..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: '35px', width: '250px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sort By:</label>
                    <select 
                      className="flux-select"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      style={{ width: '160px' }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="nameAsc">Name (A-Z)</option>
                      <option value="nameDesc">Name (Z-A)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="logout-flux-btn"
                    onClick={() => extractResidentsCSV(filteredAccounts, 'masterlist')}
                    title="Extract resident masterlist to CSV"
                    style={{ background: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', padding: '9px 14px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                  >
                    <span>📥</span> Extract Records ({filteredAccounts.length})
                  </button>
              </div>
            </div>
              <table className="flux-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Birthday</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map(account => (
                    <tr key={account.id}>
                      <td>
                        <div className="admin-photo-cell">
                          <div 
                            className="admin-photo-preview clickable"
                            onClick={() => account.photo && setSelectedPhoto(account.photo)}
                          >
                            {account.photo ? <img src={account.photo} alt="" /> : <div className="admin-photo-placeholder">None</div>}
                          </div>
                          <div className="admin-photo-actions">
                            <label className="admin-photo-btn update-btn">
                              <input type="file" accept="image/*" onChange={(e) => handleUpdatePhoto(account.id, e.target.files[0])} style={{ display: 'none' }} />
                              ✎
                            </label>
                            {account.photo && <button className="admin-photo-btn remove-btn" onClick={() => handleRemovePhoto(account.id)}>✕</button>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <button className="resident-name-button" onClick={() => openResidentDetails(account)}>
                          {account.full_name}
                        </button>
                      </td>
                      <td>{account.email}</td>
                      <td>{account.gender || '-'}</td>
                      <td>{account.age || '-'}</td>
                      <td>{formatDate(account.date_of_birth)}</td>
                      <td>{formatDateTime(account.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="logout-flux-btn" onClick={() => setSelectedChatResident(account) || setActiveTab('chat')}>Message</button>
                          <button 
                            className="logout-flux-btn" 
                            style={{ backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fcd34d' }}
                            onClick={() => handleArchiveResident(account.id, account.full_name)}
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-dashboard">
              {/* Header with Month & Year Filtering */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>📈 Analytics Overview</h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Filter records by Month and Year to analyze trends and document processing.
                  </p>
                </div>

                {/* Filter Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Year Select */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Year:</span>
                    <select
                      className="flux-select"
                      value={analyticsYear}
                      onChange={(e) => setAnalyticsYear(e.target.value)}
                      style={{ padding: '7px 12px', fontSize: '13px', width: '110px' }}
                    >
                      <option value="All">All Years</option>
                      {availableYears.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month Select */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Month:</span>
                    <select
                      className="flux-select"
                      value={analyticsMonth}
                      onChange={(e) => setAnalyticsMonth(e.target.value)}
                      style={{ padding: '7px 12px', fontSize: '13px', width: '130px' }}
                    >
                      {monthOptions.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Filters */}
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      type="button"
                      className="logout-flux-btn"
                      onClick={() => { setAnalyticsYear('All'); setAnalyticsMonth('All'); }}
                      style={{ 
                        padding: '7px 12px', 
                        fontSize: '12px', 
                        background: (analyticsYear === 'All' && analyticsMonth === 'All') ? 'var(--primary-color)' : 'var(--bg-secondary)', 
                        color: (analyticsYear === 'All' && analyticsMonth === 'All') ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                    >
                      All Time
                    </button>
                    <button
                      type="button"
                      className="logout-flux-btn"
                      onClick={() => { 
                        setAnalyticsYear(new Date().getFullYear().toString()); 
                        setAnalyticsMonth(new Date().getMonth().toString()); 
                      }}
                      style={{ 
                        padding: '7px 12px', 
                        fontSize: '12px', 
                        background: (analyticsYear === new Date().getFullYear().toString() && analyticsMonth === new Date().getMonth().toString()) ? 'var(--primary-color)' : 'var(--bg-secondary)', 
                        color: (analyticsYear === new Date().getFullYear().toString() && analyticsMonth === new Date().getMonth().toString()) ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                    >
                      This Month
                    </button>
                    <button
                      type="button"
                      className="logout-flux-btn"
                      onClick={() => {
                        const periodLabel = analyticsMonth !== 'All' ? `${monthOptions.find(m => m.value === analyticsMonth)?.label}_${analyticsYear !== 'All' ? analyticsYear : 'all'}` : analyticsYear !== 'All' ? `Year_${analyticsYear}` : 'All_Time';
                        const filteredReqs = certificateRequests.filter(req => {
                          const rawDate = req.request_date || req.created_at;
                          if (!rawDate) return analyticsYear === 'All' && analyticsMonth === 'All';
                          const d = new Date(rawDate);
                          if (isNaN(d.getTime())) return false;
                          if (analyticsYear !== 'All' && d.getFullYear().toString() !== analyticsYear.toString()) return false;
                          if (analyticsMonth !== 'All' && d.getMonth().toString() !== analyticsMonth.toString()) return false;
                          return true;
                        });
                        extractCertificateRequestsCSV(filteredReqs, `Filtered_${periodLabel}`);
                      }}
                      title="Extract records for the current filter period to CSV"
                      style={{ 
                        padding: '7px 12px', 
                        fontSize: '12px', 
                        background: '#185abd', 
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>📥</span> Extract Filtered ({analyticsData.totalRequestsCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Certificate Requests</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#3b82f6', marginTop: '4px' }}>{analyticsData.totalRequestsCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {analyticsMonth !== 'All' ? `${monthOptions.find(m => m.value === analyticsMonth)?.label} ${analyticsYear !== 'All' ? analyticsYear : ''}` : analyticsYear !== 'All' ? `Year ${analyticsYear}` : 'All-time'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>New Registrations</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>{analyticsData.totalRegistrationsCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Residents joined</div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Claimed Documents</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#8b5cf6', marginTop: '4px' }}>
                    {analyticsData.claimedRequestsCount} <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({analyticsData.claimRate}%)</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Pick-up completed</div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Verified Certificates</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#f59e0b', marginTop: '4px' }}>{analyticsData.verifiedRequestsCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>QR Authenticated</div>
                </div>
              </div>
              
              {/* Analytics Charts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                
                {/* Registrations Over Time */}
                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                    Resident Registrations {analyticsMonth !== 'All' ? `(${monthOptions.find(m => m.value === analyticsMonth)?.label} ${analyticsYear !== 'All' ? analyticsYear : ''})` : analyticsYear !== 'All' ? `(${analyticsYear})` : '(Over Time)'}
                  </h3>
                  <div style={{ height: '300px', width: '100%' }}>
                    {analyticsData.registrationData.length === 0 ? (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No registrations in this period</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.registrationData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <Line type="monotone" dataKey="Registrations" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Request Types Distribution */}
                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                    Certificate Requests Breakdown {analyticsYear !== 'All' || analyticsMonth !== 'All' ? `(${analyticsMonth !== 'All' ? monthOptions.find(m => m.value === analyticsMonth)?.label : ''} ${analyticsYear !== 'All' ? analyticsYear : ''})` : ''}
                  </h3>
                  <div style={{ height: '300px', width: '100%' }}>
                    {analyticsData.requestTypeData.length === 0 ? (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No certificate requests in this period</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.requestTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsData.requestTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Age Demographics */}
                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                    Age Demographics {analyticsYear !== 'All' || analyticsMonth !== 'All' ? `(${analyticsMonth !== 'All' ? monthOptions.find(m => m.value === analyticsMonth)?.label : ''} ${analyticsYear !== 'All' ? analyticsYear : ''})` : ''}
                  </h3>
                  <div style={{ height: '300px', width: '100%' }}>
                    {analyticsData.ageData.length === 0 ? (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No demographic data for this period</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.ageData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="Count" radius={[4, 4, 0, 0]}>
                            {analyticsData.ageData.map((entry, index) => (
                              <Cell key={`age-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][index % 6]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Status Breakdown */}
                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                    Requests by Process Status {analyticsYear !== 'All' || analyticsMonth !== 'All' ? `(${analyticsMonth !== 'All' ? monthOptions.find(m => m.value === analyticsMonth)?.label : ''} ${analyticsYear !== 'All' ? analyticsYear : ''})` : ''}
                  </h3>
                  <div style={{ height: '300px', width: '100%' }}>
                    {analyticsData.statusData.every(d => d.Count === 0) ? (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No requests in this period</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.statusData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="Count" radius={[4, 4, 0, 0]}>
                            {analyticsData.statusData.map((entry, index) => {
                              const statusColors = {
                                'In process': '#3b82f6',
                                'For Pickup': '#f59e0b',
                                'Claimed': '#10b981',
                                'Void': '#ef4444'
                              };
                              return <Cell key={`status-${index}`} fill={statusColors[entry.name] || '#8b5cf6'} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'archived' && (
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <button 
                    style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: archiveSubTab === 'residents' ? 'bold' : 'normal', color: archiveSubTab === 'residents' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => setArchiveSubTab('residents')}
                  >
                    🗄️ Archived Residents
                  </button>
                  <button 
                    style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: archiveSubTab === 'files' ? 'bold' : 'normal', color: archiveSubTab === 'files' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => setArchiveSubTab('files')}
                  >
                    📁 Document Archives
                  </button>
                </div>
                {archiveSubTab === 'residents' && (
                  <div className="header-search" style={{ margin: 0 }}>
                    <span className="search-icon">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search archived residents..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ padding: '8px 12px 8px 35px' }}
                    />
                  </div>
                )}
              </div>

              {archiveSubTab === 'residents' && (
                <div className="resident-archives">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {currentResidentFolder ? (
                        <>
                          <button className="logout-flux-btn" onClick={() => setCurrentResidentFolder(null)} style={{ marginRight: '10px', padding: '8px 12px' }}>← Back</button>
                          🗂️ {currentResidentFolder.name}
                        </>
                      ) : (
                        "Resident Folders"
                      )}
                    </div>
                    <div>
                      {!currentResidentFolder && (
                        <button className="logout-flux-btn" onClick={() => setShowCreateResidentFolder(true)}>+ Create Folder</button>
                      )}
                    </div>
                  </div>

                  {showCreateResidentFolder && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Folder Name" 
                        value={newResidentFolderName}
                        onChange={(e) => setNewResidentFolderName(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', flex: 1 }}
                      />
                      <button className="logout-flux-btn" onClick={handleCreateResidentFolder}>Save</button>
                      <button className="logout-flux-btn" onClick={() => setShowCreateResidentFolder(false)} style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' }}>Cancel</button>
                    </div>
                  )}

                  {!currentResidentFolder && (
                    <div className="archive-grid" style={{ marginBottom: '40px' }}>
                      {residentArchiveFolders.length > 0 ? residentArchiveFolders.map(folder => (
                        <div key={folder.id} className="folder-card" onClick={() => setCurrentResidentFolder(folder)}>
                          <div className="folder-icon">🗂️</div>
                          <div className="folder-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                            {editingFolderId === folder.id ? (
                              <div style={{ display: 'flex', gap: '5px', flex: 1 }} onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="text" 
                                  value={editingFolderName}
                                  onChange={(e) => setEditingFolderName(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleRenameFolder(e, folder.id, true)}
                                  style={{ padding: '4px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                  autoFocus
                                />
                                <button className="logout-flux-btn" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={(e) => handleRenameFolder(e, folder.id, true)}>Save</button>
                                <button className="logout-flux-btn" style={{ padding: '4px 8px', fontSize: '12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' }} onClick={(e) => { e.stopPropagation(); setEditingFolderId(null) }}>✕</button>
                              </div>
                            ) : (
                              <>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</span>
                                <button 
                                  onClick={(e) => startEditingFolder(e, folder)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '0 5px' }}
                                  title="Rename folder"
                                >
                                  ✎
                                </button>
                              </>
                            )}
                          </div>
                          <div className="folder-meta">{formatDateTime(folder.created_at)}</div>
                        </div>
                      )) : (
                        <p style={{ color: 'var(--text-secondary)' }}>No resident folders created yet.</p>
                      )}
                    </div>
                  )}


                  <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--text-primary)' }}>
                    {currentResidentFolder ? `Residents in ${currentResidentFolder.name}` : 'Unassigned Residents'}
                  </h3>

                  {(() => {
                    const residentsToDisplay = filteredArchivedAccounts.filter(a => 
                      currentResidentFolder 
                        ? a.archive_folder_id === currentResidentFolder.id 
                        : !a.archive_folder_id
                    );

                    if (residentsToDisplay.length === 0) {
                      return <p style={{ padding: '18px 0', color: 'var(--text-secondary)' }}>No residents found here.</p>;
                    }

                    return (
                      <table className="flux-table">
                        <thead>
                          <tr>
                            <th>Photo</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Birthday</th>
                            <th>Archived On</th>
                            <th>Move to Folder</th>
                          </tr>
                        </thead>
                        <tbody>
                          {residentsToDisplay.map((account) => (
                            <tr key={account.id}>
                              <td>
                                <div className="admin-photo-cell">
                                  <div 
                                    className="admin-photo-preview clickable"
                                    onClick={() => account.photo && setSelectedPhoto(account.photo)}
                                  >
                                    {account.photo ? <img src={account.photo} alt="" /> : <div className="admin-photo-placeholder">None</div>}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <button className="resident-name-button" onClick={() => openResidentDetails(account)}>
                                  {account.full_name}
                                </button>
                              </td>
                              <td>{account.email}</td>
                              <td>{formatDate(account.date_of_birth)}</td>
                              <td>{formatDateTime(account.archived_at)}</td>
                              <td>
                                <select 
                                  value={account.archive_folder_id || ""}
                                  onChange={(e) => handleMoveResidentToFolder(account.id, e.target.value || null)}
                                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                >
                                  <option style={{ color: '#000', backgroundColor: '#fff' }} value="">Unassigned</option>
                                  {residentArchiveFolders.map(f => (
                                    <option style={{ color: '#000', backgroundColor: '#fff' }} key={f.id} value={f.id}>{f.name}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              )}

              {archiveSubTab === 'files' && (
                <div className="document-archives">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {currentFolder ? (
                        <>
                          <button className="logout-flux-btn" onClick={() => setCurrentFolder(null)} style={{ marginRight: '10px', padding: '8px 12px' }}>← Back</button>
                          📁 {currentFolder.name}
                        </>
                      ) : (
                        "Root Folders"
                      )}
                    </div>
                    <div>
                      {!currentFolder ? (
                        <button className="logout-flux-btn" onClick={() => setShowCreateFolder(true)}>+ Create Folder</button>
                      ) : (
                        <label className="logout-flux-btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
                          {uploadingFile ? 'Uploading...' : '↑ Upload File'}
                          <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploadingFile} />
                        </label>
                      )}
                    </div>
                  </div>

                  {showCreateFolder && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Folder Name" 
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', flex: 1 }}
                      />
                      <button className="logout-flux-btn" onClick={handleCreateFolder}>Save</button>
                      <button className="logout-flux-btn" onClick={() => setShowCreateFolder(false)} style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' }}>Cancel</button>
                    </div>
                  )}

                  {!currentFolder ? (
                    <div className="archive-grid">
                      {archiveFolders.length > 0 ? archiveFolders.map(folder => (
                        <div key={folder.id} className="folder-card" onClick={() => setCurrentFolder(folder)}>
                          <div className="folder-icon">📁</div>
                          <div className="folder-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                            {editingFolderId === folder.id ? (
                              <div style={{ display: 'flex', gap: '5px', flex: 1 }} onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="text" 
                                  value={editingFolderName}
                                  onChange={(e) => setEditingFolderName(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleRenameFolder(e, folder.id, false)}
                                  style={{ padding: '4px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                  autoFocus
                                />
                                <button className="logout-flux-btn" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={(e) => handleRenameFolder(e, folder.id, false)}>Save</button>
                                <button className="logout-flux-btn" style={{ padding: '4px 8px', fontSize: '12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' }} onClick={(e) => { e.stopPropagation(); setEditingFolderId(null) }}>✕</button>
                              </div>
                            ) : (
                              <>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</span>
                                <button 
                                  onClick={(e) => startEditingFolder(e, folder)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '0 5px' }}
                                  title="Rename folder"
                                >
                                  ✎
                                </button>
                              </>
                            )}
                          </div>
                          <div className="folder-meta">{formatDateTime(folder.created_at)}</div>
                        </div>
                      )) : (
                        <p style={{ color: 'var(--text-secondary)' }}>No folders created yet.</p>
                      )}
                    </div>
                  ) : (
                    <div className="archive-grid">
                      {archiveFiles.length > 0 ? archiveFiles.map(file => (
                        <div key={file.id} className="file-card">
                          <div className="file-icon">📄</div>
                          <div className="file-name" title={file.file_name}>{file.file_name}</div>
                          <div className="file-meta">{(file.file_size / 1024).toFixed(1)} KB</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '8px' }}>
                            <a 
                              href={`/api/admin/archive-files/download/${file.id}`} 
                              download={file.file_name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="download-btn"
                              style={{ textAlign: 'center' }}
                            >
                              Download
                            </a>
                            <select
                              value={file.folder_id || ""}
                              onChange={(e) => handleMoveFileToFolder(file.id, e.target.value)}
                              style={{
                                padding: '6px 8px',
                                fontSize: '12px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                width: '100%',
                                cursor: 'pointer'
                              }}
                              title="Move file to another folder"
                            >
                              <option value="" disabled>Move to folder...</option>
                              {archiveFolders.map(f => (
                                <option key={f.id} value={f.id} disabled={f.id === currentFolder?.id}>
                                  {f.id === currentFolder?.id ? `✓ ${f.name} (Current)` : `📁 ${f.name}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )) : (
                        <p style={{ color: 'var(--text-secondary)' }}>No files in this folder.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'residentDetail' && selectedResident && (
            <div className="resident-detail-panel">
              <div className="resident-detail-header">
                <div>
                  <h2>Resident Details</h2>
                  <p>Viewing account information for {selectedResident.full_name}</p>
                </div>
                <div className="resident-detail-actions">
                  <button className="logout-flux-btn" onClick={closeResidentDetails}>← Back to residents</button>
                  <button className="logout-flux-btn" onClick={handleMessageResident}>Message Resident</button>
                  {selectedResident.is_archived !== 'Yes' ? (
                    <button 
                      className="logout-flux-btn" 
                      style={{ backgroundColor: '#f59e0b', color: 'white', borderColor: '#f59e0b' }}
                      onClick={() => handleArchiveResident(selectedResident.id, selectedResident.full_name)}
                    >
                      Archive Account
                    </button>
                  ) : (
                    <span style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#374151' }}>Archived</span>
                  )}
                </div>
              </div>

              <div className="resident-detail-card">
                <div className="resident-detail-summary">
                  <div className="resident-detail-image clickable" onClick={() => selectedResident.photo && setSelectedPhoto(selectedResident.photo)}>
                    {selectedResident.photo ? <img src={selectedResident.photo} alt="Resident" /> : <div className="admin-photo-placeholder">No Photo</div>}
                  </div>
                  <div>
                    <h3>{selectedResident.full_name}</h3>
                    <p>{selectedResident.email || '-'}</p>
                    <p className="resident-detail-subtitle">
                      {selectedResident.gender || 'Unknown gender'} • {selectedResident.age || (selectedResident.date_of_birth ? (new Date().getFullYear() - new Date(selectedResident.date_of_birth).getFullYear()) : '-')} years old
                    </p>
                  </div>
                </div>

                {/* Personal Information */}
                <h4 className="detail-section-title">👤 Personal Information</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row">
                    <span>Full Name</span>
                    <strong>{selectedResident.full_name || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Nickname</span>
                    <strong>{selectedResident.nickname || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Gender</span>
                    <strong>{selectedResident.gender || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Age</span>
                    <strong>{selectedResident.age || (selectedResident.date_of_birth ? (new Date().getFullYear() - new Date(selectedResident.date_of_birth).getFullYear()) : '-')}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Birthday</span>
                    <strong>{formatDate(selectedResident.date_of_birth)}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Civil Status</span>
                    <strong>{selectedResident.civil_status || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Religion</span>
                    <strong>{selectedResident.religion || '-'}</strong>
                  </div>
                </div>

                {/* Address & Area */}
                <h4 className="detail-section-title">📍 Address & Location</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row" style={{ gridColumn: 'span 2' }}>
                    <span>Residential Address</span>
                    <strong>{selectedResident.home_address || selectedResident.address || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Barangay</span>
                    <strong>{selectedResident.barangay || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>City/Municipality</span>
                    <strong>{selectedResident.city_municipality || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Area</span>
                    <strong>{selectedResident.area === 'Others' ? selectedResident.other_area : selectedResident.area || '-'}</strong>
                  </div>
                </div>

                {/* Contact Information */}
                <h4 className="detail-section-title">📞 Contact Information</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row">
                    <span>Mobile Phone</span>
                    <strong>{selectedResident.mobile_phone || selectedResident.phone || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Email Address</span>
                    <strong>{selectedResident.email || '-'}</strong>
                  </div>
                </div>

                {/* Education */}
                <h4 className="detail-section-title">🎓 Educational Background</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row">
                    <span>Post Graduate</span>
                    <strong>{selectedResident.post_grad_course || '-'} {selectedResident.post_grad_year ? `(${selectedResident.post_grad_year})` : ''}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>College</span>
                    <strong>{selectedResident.college_course || '-'} {selectedResident.college_year ? `(${selectedResident.college_year})` : ''}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>High School</span>
                    <strong>{selectedResident.high_school || '-'} {selectedResident.high_school_year ? `(${selectedResident.high_school_year})` : ''}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Elementary</span>
                    <strong>{selectedResident.elementary || '-'} {selectedResident.elementary_year ? `(${selectedResident.elementary_year})` : ''}</strong>
                  </div>
                  {selectedResident.other_education && (
                    <div className="resident-detail-row" style={{ gridColumn: 'span 2' }}>
                      <span>Other Education</span>
                      <strong>{selectedResident.other_education} {selectedResident.other_year ? `(${selectedResident.other_year})` : ''}</strong>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                <h4 className="detail-section-title">🆘 Emergency Contact</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row">
                    <span>Contact Name</span>
                    <strong>{selectedResident.emergency_name || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Phone Number</span>
                    <strong>{selectedResident.emergency_phone || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Relationship</span>
                    <strong>{selectedResident.relationship || '-'}</strong>
                  </div>
                </div>

                {/* Identity Documents */}
                <h4 className="detail-section-title">🆔 Identity Verification</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row">
                    <span>Official ID Photo</span>
                    <div className="id-photo-container">
                      {selectedResident.id_photo ? (
                        <img 
                          src={selectedResident.id_photo} 
                          alt="Official ID" 
                          className="clickable" 
                          onClick={() => setSelectedPhoto(selectedResident.id_photo)}
                          style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '10px', border: '1px solid var(--border-dark)' }}
                        />
                      ) : (
                        <div className="admin-photo-placeholder" style={{ padding: '20px', background: '#f1f5f9', borderRadius: '12px', marginTop: '10px' }}>
                          No ID Photo Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="resident-detail-row">
                    <span>Digital Signature</span>
                    <div className="id-photo-container">
                      {selectedResident.signature_file ? (
                        <img 
                          src={selectedResident.signature_file} 
                          alt="Signature" 
                          style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', marginTop: '10px' }}
                        />
                      ) : (
                        <div className="admin-photo-placeholder" style={{ padding: '20px', background: '#f1f5f9', borderRadius: '12px', marginTop: '10px' }}>
                          No Signature Provided
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pending' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0 }}>⏳ Pending Registrations ({filteredPendingRegistrations.length})</h2>
                  <input 
                    type="text" 
                    placeholder="Search name, email..." 
                    className="flux-input"
                    value={pendingRegSearchTerm}
                    onChange={(e) => setPendingRegSearchTerm(e.target.value)}
                    style={{ width: '250px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sort By:</label>
                    <select 
                      className="flux-select"
                      value={pendingRegSortOrder}
                      onChange={(e) => setPendingRegSortOrder(e.target.value)}
                      style={{ width: '160px' }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="nameAsc">Name (A-Z)</option>
                      <option value="nameDesc">Name (Z-A)</option>
                    </select>
                  </div>
                </div>
                {pendingRegistrations.length > 0 && (
                  <button 
                    className="logout-flux-btn" 
                    style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={handleApproveAllResidents}
                  >
                    ✓ Approve All
                  </button>
                )}
              </div>
              {pendingRegistrations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No pending registrations. All applicants have been reviewed.
                </div>
              ) : filteredPendingRegistrations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No matching pending registrations found.
                </div>
              ) : (
                <table className="flux-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Gender</th>
                      <th>Age</th>
                      <th>Applied On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPendingRegistrations.map(resident => (
                      <tr key={resident.id}>
                        <td>
                          <div className="admin-photo-cell">
                            <div 
                              className="admin-photo-preview clickable"
                              onClick={() => resident.photo && setSelectedPhoto(resident.photo)}
                            >
                              {resident.photo ? <img src={resident.photo} alt="" /> : <div className="admin-photo-placeholder">None</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <button className="resident-name-button" onClick={() => openResidentDetails(resident)}>
                            {resident.full_name}
                          </button>
                        </td>
                        <td>{resident.email}</td>
                        <td>{resident.gender || '-'}</td>
                        <td>{resident.age || '-'}</td>
                        <td>{formatDateTime(resident.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="logout-flux-btn" 
                              style={{ backgroundColor: '#10b981', padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => handleApproveResident(resident.id)}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className="logout-flux-btn" 
                              style={{ backgroundColor: '#ef4444', padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => handleRejectResident(resident.id)}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === 'updates' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>🔄 Pending Profile Updates ({filteredPendingUpdates.length})</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    placeholder="Search resident, changes..." 
                    className="flux-input"
                    value={pendingUpdSearchTerm}
                    onChange={(e) => setPendingUpdSearchTerm(e.target.value)}
                    style={{ width: '250px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sort By:</label>
                    <select 
                      className="flux-select"
                      value={pendingUpdSortOrder}
                      onChange={(e) => setPendingUpdSortOrder(e.target.value)}
                      style={{ width: '160px' }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="nameAsc">Name (A-Z)</option>
                      <option value="nameDesc">Name (Z-A)</option>
                    </select>
                  </div>
                </div>
              </div>
              {pendingUpdates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No pending profile update requests.
                </div>
              ) : filteredPendingUpdates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No matching pending profile update requests found.
                </div>
              ) : (
                <table className="flux-table">
                  <thead>
                    <tr>
                      <th>Resident</th>
                      <th>Requested Changes</th>
                      <th>Requested On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPendingUpdates.map(update => (
                      <tr key={update.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="admin-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                              {update.photo ? <img src={update.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : update.current_name.charAt(0)}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: '600' }}>{update.current_name}</p>
                              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{update.resident_email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                            {update.full_name !== null && <div>• Name: {update.full_name}</div>}
                            {update.nickname !== null && <div>• Nickname: {update.nickname}</div>}
                            {update.home_address !== null && <div>• Address: {update.home_address}</div>}
                            {update.mobile_phone !== null && <div>• Phone: {update.mobile_phone}</div>}
                            {update.photo !== null && <div>• New Photo uploaded</div>}
                            <button 
                              style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', padding: 0, cursor: 'pointer', fontSize: '11px', marginTop: '5px' }}
                              onClick={() => {
                                showNotification(`Requested Profile Details — Name: ${update.full_name || 'N/A'} | Address: ${update.home_address || 'N/A'} | Phone: ${update.mobile_phone || 'N/A'} | Gender: ${update.gender || 'N/A'} | Civil Status: ${update.civil_status || 'N/A'}`, 'info', 7000)
                              }}
                            >
                              View all details
                            </button>
                          </div>
                        </td>
                        <td>{formatDateTime(update.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="logout-flux-btn" 
                              style={{ backgroundColor: '#10b981', padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => handleApproveUpdate(update.id)}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className="logout-flux-btn" 
                              style={{ backgroundColor: '#ef4444', padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => handleRejectUpdate(update.id)}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>📄 Certificate Requests</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <input 
                    type="text" 
                    placeholder="Search name or type..." 
                    className="flux-input"
                    value={requestSearchTerm}
                    onChange={(e) => setRequestSearchTerm(e.target.value)}
                    style={{ width: '250px' }}
                  />
                  <select 
                    className="flux-select"
                    value={requestStatusFilter}
                    onChange={(e) => setRequestStatusFilter(e.target.value)}
                    style={{ width: '180px' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Verified">Verified</option>
                    <option value="Not Verified">Not Verified</option>
                    <option value="Void">Void</option>
                    <option value="In process">In process</option>
                    <option value="For Pickup">For Pickup</option>
                    <option value="Claimed">Claimed</option>
                  </select>
                  <button
                    type="button"
                    className="logout-flux-btn"
                    onClick={() => extractCertificateRequestsCSV(filteredRequests, requestStatusFilter === 'All' ? 'all' : requestStatusFilter.toLowerCase().replace(/\s+/g, '_'))}
                    title="Extract certificate requests to CSV"
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', padding: '9px 14px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                  >
                    <span>📥</span> Extract Records ({filteredRequests.length})
                  </button>
                </div>
              </div>
              {requestLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-purple)' }}>
                  ⏳ Loading requests from database...
                </div>
              ) : certificateRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No certificate requests found in database.
                </div>
              ) : filteredRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No requests match your search or filter.
                </div>
              ) : (
                <table className="flux-table">
                  <thead>
                    <tr>
                      <th>Resident</th>
                      <th>Type</th>
                      <th>Requested Date</th>
                      <th>Claimed Date</th>
                      <th>Verification</th>
                      <th>Process</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map(r => (
                      <tr key={r.id}>
                        <td>{r.full_name || r.resident_name || 'Resident #' + r.user_id}</td>
                        <td>{r.certificate_type}</td>
                        <td>{formatDateTime(r.request_date)}</td>
                        <td>
                          {r.process_status === 'Claimed' && r.claimed_at ? (
                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>✅</span> {formatDateTime(r.claimed_at)}
                            </span>
                          ) : r.process_status === 'Claimed' ? (
                            <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: '500' }}>Claimed</span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td><span className={`status-badge ${r.verification_status === 'Verified' ? 'status-verified' : r.verification_status === 'Not Valid' ? 'status-rejected' : 'status-pending'}`}>{r.verification_status}</span></td>
                        <td><span className={`status-badge ${getProcessStatusClass(r.process_status)}`}>{r.process_status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="logout-flux-btn" 
                              style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold' }}
                              onClick={() => {
                                setSelectedRequest(r)
                                setSelectedTemplateName(r.certificate_type || '')
                                const isLegacy = (!r.certificate_content || !r.certificate_content.trim() || (r.certificate_content.includes('is a jurisdiction of Barangay 830, Zone 90, District VI.') && !r.certificate_content.includes('EFREN V. MEDINA')));
                                let initialContent = isLegacy ? getCertificateTemplate(r) : r.certificate_content;
                                if (initialContent) {
                                  initialContent = initialContent
                                    .replace(/<div style="[^"]*">\s*Manila Seal\s*<\/div>/gi, '<img src="/logo_manila.png" alt="City of Manila Seal" style="width: 50px; height: 50px; object-fit: contain;" />')
                                    .replace(/<div style="width:\s*90px;\s*height:\s*90px;[^"]*">\s*<span>BAGONG<\/span>\s*<span>PILIPINAS<\/span>\s*<\/div>/gi, '<div style="width: 90px; height: 90px; display: flex; align-items: center; justify-content: center;"><img src="/logo_bagong_pilipinas.png" alt="Bagong Pilipinas" style="max-width: 100%; max-height: 100%; object-fit: contain;" /></div>');
                                }
                                const parsedDoc = parseDocumentAndImages(initialContent);
                                setEditorContent(parsedDoc.cleanContent)
                                setAttachedImages(parsedDoc.images || [])
                                setSelectedImageId(null)
                                setEditorVerification(r.verification_status || 'Not Verified')
                                setEditorProcess(r.process_status || 'In process')
                                setEditorClaimedAt(r.claimed_at ? new Date(r.claimed_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16))
                                setEditorPdfFile(null)
                                setRemovePdf(false)
                                setExistingPdf(r.pdf_file || null)
                                setEditorMode(r.pdf_file ? 'pdf' : 'text')
                                setVisibleToResident(r.visible_to_resident || 'text')
                                QRCode.toDataURL(`${window.location.origin}/verify/${r.tracking_code || r.id}`, { width: 100, margin: 1 })
                                  .then(url => setQrDataUrl(url))
                                  .catch(err => console.error(err))
                              }}>
                              Manage & Edit Document
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === 'chat' && (
            <div className="admin-chat-layout">
              {/* Chat Sidebar: Conversation List */}
              <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                  <h3>Conversations</h3>
                </div>
                <div className="resident-list">
                  {conversations.length === 0 ? (
                    <div className="no-conversations">No active chats</div>
                  ) : (
                    conversations.map(resident => (
                      <div 
                        key={resident.id} 
                        className={`resident-chat-item ${selectedChatResident?.id === resident.id ? 'active' : ''}`}
                        onClick={() => setSelectedChatResident(resident)}
                      >
                        <div className="admin-avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                          {resident.photo ? <img src={resident.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : resident.full_name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{resident.full_name}</p>
                            {resident.unread_count > 0 && <div className="unread-badge">{resident.unread_count}</div>}
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {resident.last_message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Window */}
              <div className="chat-window">
                {selectedChatResident ? (
                  <>
                    <div className="chat-window-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="admin-avatar" style={{ width: '40px', height: '40px' }}>
                          {selectedChatResident.photo ? <img src={selectedChatResident.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : selectedChatResident.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{selectedChatResident.full_name}</h3>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Resident Support</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="chat-window-messages">
                      {messages.map(msg => (
                        <div key={msg.id} className={`message-bubble-wrapper ${msg.sender === 'admin' ? 'admin' : 'resident'}`}>
                          <div className="chat-bubble">
                            {msg.message_text}
                            <span className="bubble-time">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-window-input">
                      <input 
                        type="text" 
                        placeholder="Type your reply..." 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button 
                        className="chat-send-btn"
                        onClick={handleSendMessage}
                        disabled={!replyText.trim()}
                      >
                        ➤
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="no-chat-selected">
                    <div className="empty-state-icon">💬</div>
                    <h3>Your Chat Center</h3>
                    <p>Select a resident from the list to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Unified Manage & Mockup Editor Modal (Microsoft Word Design) */}
      {selectedRequest && (
        <div className="flux-modal-overlay" style={{ zIndex: 1000, padding: '15px' }}>
          <div className="word-window-container" style={{ maxWidth: '1050px', width: '98%' }}>
            
            {/* 1. Word Titlebar */}
            <div className="word-titlebar">
              <div className="word-titlebar-left">
                <div className="word-app-badge">
                  <span className="word-icon-square">W</span>
                  <span>Word</span>
                </div>
                <div className="word-quick-tools">
                  <button 
                    type="button" 
                    className="word-quick-btn" 
                    title="Save Document (Ctrl+S)"
                    onClick={handleSaveCertificateDocument}
                    disabled={isSavingCertificate}
                  >
                    {isSavingCertificate ? '⏳' : '💾'}
                  </button>
                  <button 
                    type="button" 
                    className="word-quick-btn" 
                    title="Undo"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand('undo'); }}
                  >
                    ↩
                  </button>
                  <button 
                    type="button" 
                    className="word-quick-btn" 
                    title="Redo"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand('redo'); }}
                  >
                    ↪
                  </button>
                  <button 
                    type="button" 
                    className="word-quick-btn" 
                    title="Print Document"
                    onClick={() => {
                      const printWindow = window.open('', '', 'width=850,height=1000');
                      printWindow.document.write('<html><head><title>Print Certificate</title><style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { size: A4; margin: 15mm; } .print-page { height: 95vh !important; max-height: 95vh !important; display: flex; flex-direction: column; overflow: hidden; } .print-body { flex: 1; } }</style></head><body style="margin: 0; padding: 20px;">');
                      printWindow.document.write(editorContent);
                      printWindow.document.write('</body></html>');
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 500);
                    }}
                  >
                    🖨️
                  </button>
                </div>
                <span className="word-doc-title">
                  {selectedTemplateName || selectedRequest.certificate_type || 'Certificate'} - {selectedRequest.full_name || selectedRequest.resident_name || 'Resident'}.docx
                </span>
              </div>

              <div className="word-titlebar-right">
                <button type="button" className="word-win-btn" title="Minimize">—</button>
                <button type="button" className="word-win-btn" title="Restore">▢</button>
                <button 
                  type="button" 
                  className="word-win-btn close" 
                  title="Close Window"
                  onClick={() => setSelectedRequest(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 2. Word Ribbon Tabs (File, Home, Insert, Layout) */}
            <div className="word-ribbon-tabs">
              <button 
                type="button" 
                className={`word-tab word-tab-file ${activeRibbonTab === 'File' ? 'active' : ''}`}
                onClick={() => setActiveRibbonTab('File')}
              >
                File
              </button>
              <button 
                type="button" 
                className={`word-tab ${activeRibbonTab === 'Home' ? 'active' : ''}`}
                onClick={() => { setActiveRibbonTab('Home'); setEditorMode('text'); }}
              >
                Home
              </button>
              <button 
                type="button" 
                className={`word-tab ${activeRibbonTab === 'Insert' ? 'active' : ''}`}
                onClick={() => { setActiveRibbonTab('Insert'); setEditorMode('text'); }}
              >
                Insert
              </button>
              <button 
                type="button" 
                className={`word-tab ${activeRibbonTab === 'Layout' ? 'active' : ''}`}
                onClick={() => { setActiveRibbonTab('Layout'); setEditorMode('text'); }}
              >
                Layout
              </button>
              <button type="button" className="word-tab" onClick={() => { setActiveRibbonTab('Home'); setEditorMode('text'); }}>Review</button>
              <button type="button" className="word-tab" onClick={() => { setActiveRibbonTab('Home'); setEditorMode('text'); }}>View</button>
            </div>

            {/* 3. Word Ribbon Toolbar Switcher */}
            {(editorMode === 'text' || activeRibbonTab === 'File') && (
              <>
                {/* TAB 0: FILE RIBBON */}
                {activeRibbonTab === 'File' && (
                  <div className="word-ribbon-toolbar">
                    {/* Document Mode / Source Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          className={`ribbon-btn ${editorMode === 'text' ? 'active' : ''}`}
                          title="Use Built-in Word Certificate Editor"
                          onClick={() => { setEditorMode('text'); setRemovePdf(true); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '5px', padding: '6px 10px' }}
                        >
                          <span>📝</span> Word Document
                        </button>
                        <button 
                          type="button" 
                          className={`ribbon-btn ${editorMode === 'pdf' ? 'active' : ''}`}
                          title="Attach or View External PDF Certificate File"
                          onClick={() => { setEditorMode('pdf'); setRemovePdf(false); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '5px', padding: '6px 10px' }}
                        >
                          <span>📄</span> Attach PDF File
                        </button>
                      </div>
                      <div className="ribbon-group-label">Document Source</div>
                    </div>

                    {/* File Operations Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Save Document Changes"
                          onClick={handleSaveCertificateDocument}
                          disabled={isSavingCertificate}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                        >
                          <span>{isSavingCertificate ? '⏳' : '💾'}</span> {isSavingCertificate ? 'Saving...' : 'Save'}
                        </button>

                        {editorMode === 'text' && (
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Print Document"
                            onClick={() => {
                              const printWindow = window.open('', '', 'width=850,height=1000');
                              printWindow.document.write('<html><head><title>Print Certificate</title><style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { size: A4; margin: 15mm; } .print-page { height: 95vh !important; max-height: 95vh !important; display: flex; flex-direction: column; overflow: hidden; } .print-body { flex: 1; } }</style></head><body style="margin: 0; padding: 20px;">');
                              printWindow.document.write(editorContent);
                              printWindow.document.write('</body></html>');
                              printWindow.document.close();
                              printWindow.focus();
                              setTimeout(() => {
                                printWindow.print();
                                printWindow.close();
                              }, 500);
                            }}
                            style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                          >
                            <span>🖨️</span> Print
                          </button>
                        )}
                      </div>
                      <div className="ribbon-group-label">File Actions</div>
                    </div>

                    {/* Document Info Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#475563', gap: '12px', padding: '0 4px' }}>
                        <div>
                          <div><strong>Tracking:</strong> {selectedRequest?.tracking_code || 'N/A'}</div>
                          <div><strong>Resident:</strong> {selectedRequest?.full_name || selectedRequest?.resident_name || 'Resident'}</div>
                        </div>
                      </div>
                      <div className="ribbon-group-label">Document Info</div>
                    </div>
                  </div>
                )}
                {/* TAB 1: HOME RIBBON */}
                {activeRibbonTab === 'Home' && (
                  <div className="word-ribbon-toolbar">
                    {/* Clipboard / History Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content">
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Undo (Ctrl+Z)"
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand('undo'); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                        </button>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Redo (Ctrl+Y)"
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand('redo'); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
                        </button>
                      </div>
                      <div className="ribbon-group-label">Undo</div>
                    </div>

                    {/* Font Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <select 
                            className="ribbon-select" 
                            defaultValue="Arial"
                            onChange={(e) => document.execCommand('fontName', false, e.target.value)}
                            style={{ width: '130px' }}
                          >
                            <option value="Arial">Arial</option>
                            <option value="Calibri">Calibri</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Courier New">Courier New</option>
                          </select>

                          <select 
                            className="ribbon-select" 
                            defaultValue="3"
                            onChange={(e) => document.execCommand('fontSize', false, e.target.value)}
                            style={{ width: '65px' }}
                          >
                            <option value="1">10 pt</option>
                            <option value="2">11 pt</option>
                            <option value="3">12 pt</option>
                            <option value="4">14 pt</option>
                            <option value="5">18 pt</option>
                            <option value="6">24 pt</option>
                            <option value="7">36 pt</option>
                          </select>

                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Increase Font Size"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('fontSize', false, '5'); }}
                            style={{ fontWeight: 'bold', fontSize: '11px' }}
                          >
                            A▲
                          </button>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Decrease Font Size"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('fontSize', false, '2'); }}
                            style={{ fontWeight: 'bold', fontSize: '11px' }}
                          >
                            A▼
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Bold (Ctrl+B)"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }}
                            style={{ fontWeight: '900', fontFamily: 'serif' }}
                          >
                            B
                          </button>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Italic (Ctrl+I)"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }}
                            style={{ fontStyle: 'italic', fontFamily: 'serif' }}
                          >
                            I
                          </button>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Underline (Ctrl+U)"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline'); }}
                            style={{ textDecoration: 'underline', fontFamily: 'serif' }}
                          >
                            U
                          </button>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Strikethrough"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('strikeThrough'); }}
                            style={{ textDecoration: 'line-through', fontSize: '11px' }}
                          >
                            abc
                          </button>

                          <label className="ribbon-btn font-color-wrapper" title="Font Color">
                            <span style={{ fontWeight: 'bold', borderBottom: '3px solid #dc2626', lineHeight: '14px' }}>A</span>
                            <input 
                              type="color" 
                              className="color-input-hidden" 
                              defaultValue="#000000"
                              onChange={(e) => document.execCommand('foreColor', false, e.target.value)} 
                            />
                          </label>

                          <label className="ribbon-btn font-color-wrapper" title="Highlight Color">
                            <span style={{ background: '#fef08a', padding: '0 2px', borderRadius: '2px', fontSize: '12px' }}>🖍</span>
                            <input 
                              type="color" 
                              className="color-input-hidden" 
                              defaultValue="#fef08a"
                              onChange={(e) => document.execCommand('hiliteColor', false, e.target.value)} 
                            />
                          </label>

                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Clear Formatting"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('removeFormat'); }}
                            style={{ fontSize: '11px' }}
                          >
                            <span style={{ textDecoration: 'line-through' }}>T</span>x
                          </button>
                        </div>
                      </div>
                      <div className="ribbon-group-label">Font</div>
                    </div>

                    {/* Paragraph Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Bulleted List"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList'); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                          </button>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Numbered List"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList'); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
                          </button>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Decrease Indent"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('outdent'); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="11 17 6 12 11 7"/><line x1="18" y1="18" x2="18" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/></svg>
                          </button>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Increase Indent"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('indent'); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7"/><line x1="6" y1="18" x2="6" y2="6"/><line x1="18" y1="12" x2="6" y2="12"/></svg>
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Align Left (Ctrl+L)"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyLeft'); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                          </button>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Center (Ctrl+E)"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyCenter'); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
                          </button>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Align Right (Ctrl+R)"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyRight'); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
                          </button>
                          <button 
                            type="button" 
                            className="ribbon-btn" 
                            title="Justify (Ctrl+J)"
                            onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyFull'); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
                          </button>
                        </div>
                      </div>
                      <div className="ribbon-group-label">Paragraph</div>
                    </div>

                    {/* Quick Headings / Styles Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Heading 1"
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'h1'); }}
                          style={{ fontWeight: '900', fontSize: '11px' }}
                        >
                          H1
                        </button>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Heading 2"
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'h2'); }}
                          style={{ fontWeight: 'bold', fontSize: '11px' }}
                        >
                          H2
                        </button>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Normal Text / Paragraph"
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'p'); }}
                          style={{ fontSize: '11px' }}
                        >
                          ¶ Normal
                        </button>
                      </div>
                      <div className="ribbon-group-label">Styles</div>
                    </div>
                  </div>
                )}

                {/* TAB 2: INSERT RIBBON */}
                {activeRibbonTab === 'Insert' && (
                  <div className="word-ribbon-toolbar">
                    {/* Pictures & Floating Overlay Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input 
                          type="file" 
                          ref={imageFileInputRef} 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={handleImageFileUpload} 
                        />
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Upload and insert an image from your computer (moves freely & overlays text)"
                          onMouseDown={(e) => { e.preventDefault(); imageFileInputRef.current?.click(); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px', background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', fontWeight: 'bold' }}
                        >
                          <span>🖼️</span> Attach Image
                        </button>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Insert Official Barangay 830 Logo"
                          onMouseDown={(e) => { e.preventDefault(); addPresetImage('/logo_brgy.png', 'Brgy Logo'); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                        >
                          <span>🏛️</span> Brgy Logo
                        </button>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Insert Official City of Manila Seal"
                          onMouseDown={(e) => { e.preventDefault(); addPresetImage('/logo_manila.png', 'Manila Seal', 'front', 1, 90); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                        >
                          <span>🏛️</span> Manila Seal
                        </button>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Insert Official Bagong Pilipinas Logo"
                          onMouseDown={(e) => { e.preventDefault(); addPresetImage('/logo_bagong_pilipinas.png', 'Bagong Pilipinas', 'front', 1, 90); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                        >
                          <span>🇵🇭</span> Bagong Pilipinas
                        </button>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Insert Circular Official Dry Seal (Overlay / Watermark)"
                          onMouseDown={(e) => { e.preventDefault(); addOfficialSealStamp(); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px', color: '#dc2626' }}
                        >
                          <span>🔴</span> Official Seal
                        </button>
                      </div>
                      <div className="ribbon-group-label">Pictures & Overlay</div>
                    </div>

                    {/* Active Image Layers Selector (if images attached) */}
                    {attachedImages.length > 0 && (
                      <div className="ribbon-group">
                        <div className="ribbon-group-content" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {attachedImages.map((img, idx) => (
                            <button
                              key={img.id}
                              type="button"
                              className={`ribbon-btn ${selectedImageId === img.id ? 'active' : ''}`}
                              onClick={() => setSelectedImageId(img.id)}
                              style={{ fontSize: '10px', padding: '2px 6px' }}
                              title={`Select ${img.name || 'Image'} (${img.layer === 'front' ? 'In Front' : 'Behind Text'})`}
                            >
                              {img.name ? (img.name.length > 10 ? img.name.slice(0, 10) + '…' : img.name) : `Img #${idx + 1}`}
                            </button>
                          ))}
                        </div>
                        <div className="ribbon-group-label">Layers ({attachedImages.length})</div>
                      </div>
                    )}
                    {/* Tables Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Insert 2x2 Grid Table"
                          onMouseDown={(e) => { e.preventDefault(); insertTable(2, 2); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                        >
                          <span>田</span> 2×2 Table
                        </button>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Insert 3x3 Grid Table"
                          onMouseDown={(e) => { e.preventDefault(); insertTable(3, 3); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                        >
                          <span>▦</span> 3×3 Table
                        </button>
                      </div>
                      <div className="ribbon-group-label">Tables</div>
                    </div>

                    {/* Official Templates Switcher Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <select 
                          className="ribbon-select"
                          value={selectedTemplateName || selectedRequest?.certificate_type || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) handleApplyTemplate(val);
                          }}
                          style={{ width: '175px', fontWeight: 'bold', color: '#1e3a8a', backgroundColor: '#f0f9ff' }}
                          title="Switch to another official Barangay 830 template"
                        >
                          <option value="">-- Switch Template --</option>
                          <option value="Barangay Clearance">Barangay Clearance</option>
                          <option value="Certificate of Indigency">Certificate of Indigency</option>
                          <option value="Certificate of Residency">Certificate of Residency</option>
                          <option value="First Time Job Seeker">First Time Job Seeker (RA 11261)</option>
                          <option value="Good moral for education">Good Moral (Education)</option>
                          <option value="Good moral for AFP/PNP">Good Moral (AFP/PNP)</option>
                          <option value="Barangay ID">Barangay ID / Residency</option>
                          <option value="Barangay Certificate">Barangay Certificate</option>
                        </select>
                        <button
                          type="button"
                          className="ribbon-btn"
                          title="Reset to fresh official template for this document"
                          onClick={() => {
                            if (window.confirm("Reload official Barangay 830 template? Manual unsaved edits will be replaced.")) {
                              handleApplyTemplate(selectedRequest?.certificate_type || 'Barangay Clearance');
                            }
                          }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px', background: '#eff6ff', borderColor: '#93c5fd' }}
                        >
                          <span>🔄</span> Reset
                        </button>
                      </div>
                      <div className="ribbon-group-label">Document Templates</div>
                    </div>

                    {/* Official Elements Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Insert Official Barangay 830 Letterhead Header"
                          onMouseDown={(e) => { e.preventDefault(); insertOfficialHeader(); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px', background: '#eff6ff', borderColor: '#bfdbfe' }}
                        >
                          <span>🏛️</span> Official Header
                        </button>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Insert Official Punong Barangay Signature Line"
                          onMouseDown={(e) => { e.preventDefault(); insertSignatureBlock(); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px', background: '#eff6ff', borderColor: '#bfdbfe' }}
                        >
                          <span>✍️</span> Signature Block
                        </button>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Insert Red Official Stamp Badge"
                          onMouseDown={(e) => { e.preventDefault(); insertOfficialStamp(); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px', color: '#dc2626' }}
                        >
                          <span>🔴</span> Official Seal
                        </button>
                      </div>
                      <div className="ribbon-group-label">Barangay Elements</div>
                    </div>

                    {/* Document Tools Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Insert Divider Line"
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertHorizontalRule'); }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                        >
                          <span>―</span> Divider Line
                        </button>
                        <button 
                          type="button" 
                          className="ribbon-btn" 
                          title="Insert Today's Date"
                          onMouseDown={(e) => { 
                            e.preventDefault(); 
                            const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                            document.execCommand('insertText', false, dateStr); 
                          }}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                        >
                          <span>📅</span> Date Stamp
                        </button>
                      </div>
                      <div className="ribbon-group-label">Text & Lines</div>
                    </div>

                    {/* Special Symbols Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        <button type="button" className="ribbon-btn" title="Philippine Peso Sign" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertText', false, '₱'); }}>₱</button>
                        <button type="button" className="ribbon-btn" title="Checkmark" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertText', false, '✓'); }}>✓</button>
                        <button type="button" className="ribbon-btn" title="Star" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertText', false, '★'); }}>★</button>
                        <button type="button" className="ribbon-btn" title="Section Sign" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertText', false, '§'); }}>§</button>
                        <button type="button" className="ribbon-btn" title="Copyright Sign" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertText', false, '©'); }}>©</button>
                      </div>
                      <div className="ribbon-group-label">Symbols</div>
                    </div>
                  </div>
                )}

                {/* TAB 3: LAYOUT RIBBON */}
                {activeRibbonTab === 'Layout' && (
                  <div className="word-ribbon-toolbar">
                    {/* Orientation Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          className={`ribbon-btn ${pageOrientation === 'portrait' ? 'active' : ''}`}
                          title="Portrait Orientation (Standard Vertical)"
                          onClick={() => setPageOrientation('portrait')}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                        >
                          <span>📄</span> Portrait
                        </button>
                        <button 
                          type="button" 
                          className={`ribbon-btn ${pageOrientation === 'landscape' ? 'active' : ''}`}
                          title="Landscape Orientation (Wide Certificate)"
                          onClick={() => setPageOrientation('landscape')}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                        >
                          <span>📃</span> Landscape
                        </button>
                      </div>
                      <div className="ribbon-group-label">Orientation</div>
                    </div>

                    {/* Margins Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', alignItems: 'center' }}>
                        <select 
                          className="ribbon-select" 
                          value={pageMargins} 
                          onChange={(e) => setPageMargins(e.target.value)}
                          style={{ width: '135px' }}
                        >
                          <option value="normal">Normal (1.0 in)</option>
                          <option value="narrow">Narrow (0.5 in)</option>
                          <option value="moderate">Moderate (0.75 in)</option>
                          <option value="wide">Wide (1.25 in)</option>
                        </select>
                      </div>
                      <div className="ribbon-group-label">Margins</div>
                    </div>

                    {/* Page Background & Border Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          className={`ribbon-btn ${pageWatermark ? 'active' : ''}`}
                          title="Toggle Official Seal Watermark in Background"
                          onClick={() => setPageWatermark(!pageWatermark)}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px' }}
                        >
                          <span>🛡️</span> Watermark: {pageWatermark ? 'ON' : 'OFF'}
                        </button>

                        <select 
                          className="ribbon-select" 
                          value={pageBorder} 
                          onChange={(e) => setPageBorder(e.target.value)}
                          style={{ width: '145px' }}
                        >
                          <option value="none">No Page Border</option>
                          <option value="certificate">Certificate Border</option>
                          <option value="simple">Simple Outline</option>
                        </select>
                      </div>
                      <div className="ribbon-group-label">Page Setup</div>
                    </div>

                    {/* Line Spacing Group */}
                    <div className="ribbon-group">
                      <div className="ribbon-group-content" style={{ display: 'flex', alignItems: 'center' }}>
                        <select 
                          className="ribbon-select" 
                          value={pageLineHeight} 
                          onChange={(e) => setPageLineHeight(e.target.value)}
                          style={{ width: '130px' }}
                        >
                          <option value="1.2">1.0 (Single)</option>
                          <option value="1.6">1.15 (Normal)</option>
                          <option value="1.8">1.5 (1.5 lines)</option>
                          <option value="2.2">2.0 (Double)</option>
                        </select>
                      </div>
                      <div className="ribbon-group-label">Line Spacing</div>
                    </div>
                  </div>
                )}

                {/* 4. Horizontal Ruler (only in Word text editor mode) */}
                {editorMode === 'text' && (
                  <div className="word-ruler-container">
                    <div className="word-ruler-scale">
                      <div className="ruler-indent-left"></div>
                      <span className="ruler-number">1</span>
                      <span className="ruler-number">2</span>
                      <span className="ruler-number">3</span>
                      <span className="ruler-number">4</span>
                      <span className="ruler-number">5</span>
                      <span className="ruler-number">6</span>
                      <span className="ruler-number">7</span>
                      <span className="ruler-number">8</span>
                      <div className="ruler-indent-right"></div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 5. Document Workspace Canvas */}
            <div className="word-workspace-canvas">
              {editorMode === 'text' ? (
                <div 
                  className={`word-a4-page ${pageOrientation} margins-${pageMargins} border-${pageBorder} ${pageWatermark ? "has-watermark" : ""}`} 
                  style={{ lineHeight: pageLineHeight }}
                  onClick={() => setSelectedImageId(null)}
                >
                  {/* Subtle Page Header Margin Guide */}
                  <div className="word-page-header-guide"></div>

                  {/* Official Verification QR Stamp */}
                  {qrDataUrl && (
                    <div className="word-qr-stamp">
                      <img src={qrDataUrl} alt="QR Code" className="word-qr-img" />
                      <div className="word-qr-label">BARANGAY 830</div>
                      <div className="word-qr-expiry">Valid 30 Days</div>
                    </div>
                  )}

                  {/* Attached Floating Images (Movable & Layerable Just Like Word) */}
                  {attachedImages.map((img) => (
                    <FloatingDocumentImage
                      key={img.id}
                      img={img}
                      isSelected={selectedImageId === img.id}
                      onSelect={() => setSelectedImageId(img.id)}
                      onUpdate={(updates) => updateAttachedImage(img.id, updates)}
                      onDelete={() => deleteAttachedImage(img.id)}
                    />
                  ))}

                  {/* Document Body */}
                  <DocumentEditor 
                    initialContent={editorContent}
                    requestId={selectedRequest?.id}
                    onChange={(html) => setEditorContent(html)}
                  />

                  {/* Subtle Page Footer Guide */}
                  <div className="word-page-footer-guide">
                    <span>Barangay 830, Zone 90, District VI</span>
                    <span>Page 1 of 1</span>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', maxWidth: '800px', width: '100%', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ color: '#0f172a', marginBottom: '15px' }}>Attach PDF Document</h3>
                  
                  {(!editorPdfFile && (!existingPdf || removePdf)) && (
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          setEditorPdfFile(e.target.files[0]);
                          setRemovePdf(false);
                        }
                      }}
                      style={{ marginBottom: '20px' }}
                    />
                  )}

                  {editorPdfFile ? (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '10px' }}>✅ New File selected: {editorPdfFile.name}</div>
                      <iframe 
                        src={URL.createObjectURL(editorPdfFile)} 
                        style={{ width: '100%', height: '500px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '15px' }}
                        title="PDF Preview"
                      />
                      <button 
                        onClick={() => setEditorPdfFile(null)}
                        style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Cancel / Choose Different File
                      </button>
                    </div>
                  ) : existingPdf && !removePdf ? (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '10px' }}>✅ Current PDF is attached.</div>
                      <iframe 
                        src={existingPdf} 
                        style={{ width: '100%', height: '500px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '15px' }}
                        title="PDF Preview"
                      />
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <a href={existingPdf} download="certificate.pdf" target="_blank" rel="noreferrer" style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>Download PDF</a>
                        <button 
                          onClick={() => setRemovePdf(true)}
                          style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Replace File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#64748b' }}>No file selected. Please choose a PDF file.</div>
                  )}
                </div>
              )}
            </div>

            {/* 6. Word Status Bar */}
            <div className="word-statusbar">
              <div className="word-statusbar-left">
                <div className="word-status-item">
                  <span>Page 1 of 1</span>
                </div>
                <div className="word-status-item">
                  <span>{getWordCount(editorContent)} words</span>
                </div>
                <div className="word-status-item">
                  <span>English (Philippines)</span>
                </div>
                <div className="word-status-item">
                  <span>✓ Accessibility: Good</span>
                </div>
              </div>

              <div className="word-statusbar-right">
                <div className="word-status-item" style={{ gap: '6px' }}>
                  <span title="Print Layout" style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.2)', padding: '2px 4px', borderRadius: '3px' }}>📄 Print Layout</span>
                  <span title="Web Layout" style={{ cursor: 'pointer', padding: '2px 4px' }}>🌐 Web</span>
                </div>
                <div className="word-zoom-slider">
                  <span>－</span>
                  <span style={{ display: 'inline-block', width: '50px', height: '2px', background: 'rgba(255,255,255,0.6)', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-4px', left: '50%', width: '10px', height: '10px', background: '#fff', borderRadius: '50%' }}></span>
                  </span>
                  <span>＋</span>
                  <span style={{ fontWeight: 'bold' }}>100%</span>
                </div>
              </div>
            </div>

            {/* 7. Document Settings & Save Bar */}
            <div className="word-mgmt-footer">
              <div className="word-mgmt-inputs">
                <div className="word-mgmt-field" style={{ minWidth: '220px' }}>
                  <label className="word-mgmt-label">Resident View Mode</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', height: '36px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px' }}>
                      <input 
                        type="radio" 
                        name="visibility" 
                        checked={visibleToResident === 'text'} 
                        onChange={() => setVisibleToResident('text')} 
                      />
                      <span style={{ fontWeight: visibleToResident === 'text' ? 'bold' : 'normal', color: '#1e293b' }}>Word Document</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px' }}>
                      <input 
                        type="radio" 
                        name="visibility" 
                        checked={visibleToResident === 'pdf'} 
                        onChange={() => setVisibleToResident('pdf')} 
                      />
                      <span style={{ fontWeight: visibleToResident === 'pdf' ? 'bold' : 'normal', color: '#1e293b' }}>Attached PDF</span>
                    </label>
                  </div>
                </div>

                <div className="word-mgmt-field">
                  <label className="word-mgmt-label">Verification Status</label>
                  <select 
                    className="word-mgmt-select"
                    value={editorVerification} 
                    onChange={(e) => setEditorVerification(e.target.value)}
                  >
                    <option value="Not Verified">Not Verified</option>
                    <option value="Verified">Verified (Valid 30 Days)</option>
                    <option value="Not Valid">Not Valid</option>
                  </select>
                </div>

                <div className="word-mgmt-field">
                  <label className="word-mgmt-label">Process Status</label>
                  <select 
                    className="word-mgmt-select"
                    value={editorProcess} 
                    onChange={(e) => {
                      setEditorProcess(e.target.value);
                      if (e.target.value === 'Claimed' && !editorClaimedAt) {
                        setEditorClaimedAt(new Date().toISOString().slice(0, 16));
                      }
                    }}
                  >
                    <option value="In process">In process</option>
                    <option value="For Pickup">For Pickup</option>
                    <option value="Claimed">Claimed</option>
                    <option value="Void">Void</option>
                  </select>
                </div>

                {editorProcess === 'Claimed' && (
                  <div className="word-mgmt-field">
                    <label className="word-mgmt-label">Claimed Date & Time</label>
                    <input 
                      type="datetime-local" 
                      className="word-mgmt-select"
                      value={editorClaimedAt} 
                      onChange={(e) => setEditorClaimedAt(e.target.value)} 
                    />
                  </div>
                )}
              </div>

              <div className="word-mgmt-actions">
                <button 
                  type="button" 
                  className="word-btn-cancel"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </button>
                {editorMode === 'text' && (
                  <button 
                    type="button" 
                    className="word-btn-print"
                    onClick={() => {
                      const printWindow = window.open('', '', 'width=850,height=1000');
                      printWindow.document.write('<html><head><title>Print Certificate</title><style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { size: A4; margin: 15mm; } .print-page { height: 95vh !important; max-height: 95vh !important; display: flex; flex-direction: column; overflow: hidden; } .print-body { flex: 1; } }</style></head><body style="margin: 0; padding: 20px;">');
                      printWindow.document.write(editorContent);
                      printWindow.document.write('</body></html>');
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 500);
                    }}
                  >
                    <span>🖨️</span> Print
                  </button>
                )}
                <button 
                  type="button" 
                  className="word-btn-save"
                  onClick={handleSaveCertificateDocument}
                  disabled={isSavingCertificate}
                  style={{ opacity: isSavingCertificate ? 0.7 : 1, cursor: isSavingCertificate ? 'not-allowed' : 'pointer' }}
                >
                  <span>{isSavingCertificate ? '⏳' : '💾'}</span> {isSavingCertificate ? 'Saving Document...' : 'Save Document'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Extract All Records Modal */}
      {showExtractModal && (
        <div className="flux-modal-overlay" style={{ zIndex: 3000 }}>
          <div className="flux-modal" style={{ maxWidth: '640px', width: '92%', borderRadius: '16px', background: 'var(--card-bg)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <span>📥</span> Extract All Records
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Export official Barangay 830 data to Excel/CSV format for archiving and reports.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowExtractModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Option 1: Certificate Requests */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ fontSize: '26px', background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '10px' }}>📄</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--text-primary)' }}>Certificate Requests</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Tracking codes, resident details, request dates, claimed dates, and statuses.
                    </p>
                    <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                      {certificateRequests.length} Total Records
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => extractCertificateRequestsCSV(certificateRequests, 'all')}
                  className="logout-flux-btn"
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}
                >
                  Download CSV
                </button>
              </div>

              {/* Option 2: Resident Masterlist */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ fontSize: '26px', background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px' }}>👥</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--text-primary)' }}>Resident Masterlist</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Complete active resident database, contact numbers, addresses, and registration dates.
                    </p>
                    <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                      {accounts.length} Active Residents
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => extractResidentsCSV(accounts, 'masterlist')}
                  className="logout-flux-btn"
                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}
                >
                  Download CSV
                </button>
              </div>

              {/* Option 3: Pending Registrations */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ fontSize: '26px', background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '10px' }}>⏳</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--text-primary)' }}>Pending Registrations</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      New resident submissions awaiting verification and approval.
                    </p>
                    <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                      {pendingRegistrations.length} Pending Records
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={extractPendingRegistrationsCSV}
                  disabled={pendingRegistrations.length === 0}
                  className="logout-flux-btn"
                  style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', opacity: pendingRegistrations.length === 0 ? 0.5 : 1, cursor: pendingRegistrations.length === 0 ? 'not-allowed' : 'pointer' }}
                >
                  Download CSV
                </button>
              </div>

              {/* Master One-Click Batch Download */}
              <div style={{ marginTop: '4px', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(24, 90, 189, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)', border: '1px dashed #3b82f6', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>
                  Extract all datasets at once:
                </p>
                <button
                  type="button"
                  onClick={extractAllRecordsBatch}
                  className="logout-flux-btn"
                  style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 'bold', background: 'linear-gradient(135deg, #185abd 0%, #104897 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(24, 90, 189, 0.3)' }}
                >
                  ⚡ Extract All Records (Batch Export)
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

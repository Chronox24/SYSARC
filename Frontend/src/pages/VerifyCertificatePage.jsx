import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/VerifyCertificate.css';

export default function VerifyCertificatePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [status, setStatus] = useState('');
  const [certType, setCertType] = useState('');

  useEffect(() => {
    // Artificial slight delay for a nice loading animation
    const timer = setTimeout(() => {
      fetch(`/api/verify/${id}`)
        .then(res => res.json())
        .then(data => {
          setIsValid(data.valid);
          setStatus(data.status || 'Not Found');
          setCertType(data.type || 'Document');
          setLoading(false);
        })
        .catch(err => {
          console.error("Verification Error:", err);
          setIsValid(false);
          setStatus('Error connecting to server');
          setLoading(false);
        });
    }, 800);

    return () => clearTimeout(timer);
  }, [id]);

  return (
    <div className="verify-container">
      <div className="verify-card">
        {loading ? (
          <div>
            <div className="loading-spinner"></div>
            <h2 className="verify-title" style={{ marginTop: '20px', marginBottom: 0 }}>Verifying...</h2>
            <p className="status-text">Checking document authenticity</p>
          </div>
        ) : (
          <div>
            {isValid ? (
              <>
                <h2 className="verify-title">Verified</h2>
                <div className="icon-container">
                  <div className="icon-success">
                    {/* SVG Checkmark */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                </div>
                <p className="status-text">This <strong>{certType}</strong> is authentic and has been issued by Barangay 830.</p>
              </>
            ) : (
              <>
                <h2 className="verify-title">Not Verified</h2>
                <div className="icon-container">
                  <div className="icon-error">
                    {/* SVG X Mark */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <p className="status-text">
                  {status === 'Not Found' 
                    ? "This document was not found in our records. It may be forged or tampered with."
                    : `This document is currently marked as "${status}". It cannot be verified as authentic.`}
                </p>
              </>
            )}
            <div style={{ marginTop: '40px' }}>
              <Link to="/" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' }}>
                &larr; Return to Homepage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

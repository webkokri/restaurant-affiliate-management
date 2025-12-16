import React, { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

// react-bootstrap
import { Card } from 'react-bootstrap';

// ==============================|| NAV CARD ||============================== //

const NavCard = () => {
  const { customerData } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/auth/signin?ref=${customerData?.referralId || ''}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareOnSocialMedia = (platform) => {
    const shareText = `Join me using my referral code: ${customerData?.referralId}`;
    const encodedLink = encodeURIComponent(referralLink);
    const encodedText = encodeURIComponent(shareText);
    
    let shareUrl = '';
    
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedLink}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedLink}&text=${encodedText}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const downloadQRCode = () => {
    const svg = document.querySelector('#qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `referral-qr-${customerData?.referralId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <React.Fragment>
      <Card className="bg-transparent border">
        <Card.Body className="p-2 text-center">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <QRCodeSVG 
              id="qr-code-svg"
              value={referralLink}
              size={150}
              level="H"
              includeMargin={true}
            />
          </div>
          <h5>Your Referral Code</h5>
          <p>Share this code with friends</p>
          <a
            href={`/auth/signin?ref=${customerData?.referralId || ''}`}
            className="btn text-white btn-primary d-block mb-2"
            style={{ fontSize: '18px', fontWeight: 'bold', padding: '10px', textDecoration: 'none' }}
          >
            {customerData?.referralId || 'Loading...'}
          </a>
          
          <div className="d-flex gap-2 justify-content-center mb-2">
            <button
              onClick={copyToClipboard}
              className="btn btn-outline-primary btn-sm"
              style={{ fontSize: '14px' }}
              title="Copy referral link"
            >
              {copied ? 'Copied!' : '📋 Copy'}
            </button>
            <button
              onClick={downloadQRCode}
              className="btn btn-outline-success btn-sm"
              style={{ fontSize: '14px' }}
              title="Download QR Code"
            >
              ⬇️ QR
            </button>
          </div>
          
          <div className="mb-2">
            <small className="text-muted d-block mb-1">Share on:</small>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button
                onClick={() => shareOnSocialMedia('whatsapp')}
                className="btn btn-success btn-sm"
                style={{ fontSize: '12px', padding: '4px 8px' }}
                title="Share on WhatsApp"
              >
                WhatsApp
              </button>
              <button
                onClick={() => shareOnSocialMedia('facebook')}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '12px', padding: '4px 8px' }}
                title="Share on Facebook"
              >
                Facebook
              </button>
              <button
                onClick={() => shareOnSocialMedia('twitter')}
                className="btn btn-info btn-sm text-white"
                style={{ fontSize: '12px', padding: '4px 8px' }}
                title="Share on Twitter"
              >
                Twitter
              </button>
              <button
                onClick={() => shareOnSocialMedia('telegram')}
                className="btn btn-info btn-sm"
                style={{ fontSize: '12px', padding: '4px 8px' }}
                title="Share on Telegram"
              >
                Telegram
              </button>
              <button
                onClick={() => shareOnSocialMedia('linkedin')}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '12px', padding: '4px 8px' }}
                title="Share on LinkedIn"
              >
                LinkedIn
              </button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </React.Fragment>
  );
};

export default NavCard;

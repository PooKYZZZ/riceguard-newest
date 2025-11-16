import bgImage from '../assets/bg.jpg';

export const scanPageStyles = `
.scan-page {
  height: 100vh;
  width: 100%;
  background: url('${bgImage}') no-repeat center center/cover;
  display: flex;
  flex-direction: column;
  color: #fff;
  font-family: 'Nunito', sans-serif;
  font-size: small;
}

/* Hide text caret to remove blinking cursor */
.scan-page, .scan-page * {
  caret-color: transparent;
}

/* Header */
.scan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 3rem;
}

/* Place navigation to the left of the logo */
.scan-header .nav-links {
  order: 1;
}

.scan-header .logo-section {
  order: 2;
}

.scan-logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
  position:fixed;
  right:25px;
  margin-left: 20px;
  top:10px;
}

.nav-links button {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1rem;
  margin-top: 2.2rem;
  position: relative;
  left:1100px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease-in-out
  
}

.nav-links button:hover {
  color: #c7ffc9;
}

.nav-links .active {
  color: #00ff7f;
}

/* Content */
.scan-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3rem;
}

/* Upload section */
.upload-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 2rem;
  border-radius: 16px;
  backdrop-filter: blur(6px);
  width:300px;
  height:400px;
  left: 250px;
  position:fixed;
  top:125px;
}

.upload-box {
  width: 280px;
  height: 350px;
  background: #fff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #555;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.upload-box:hover {
  background: #f1f1f1;
  
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.uploaded-preview {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 10px;
}

.upload-btn {
  margin-top: 1rem;
  background: #2e7d32;
  border: none;
  padding: 0.6rem 1.5rem;
  color: white;
  font-weight: 600;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.3s;
}

.upload-btn:hover {
  background: #388e3c;
}

/* Instruction box */
.instruction-box {
  background: rgba(255, 255, 255, 0.85);
  color: #000;
  padding: 40px;
  border-radius: 25px;
  width: 750px;
  font-size: 25px;
  line-height: 10px;
  text-align: center;
  position:fixed;
  right: -20px;
  
  
}

/* Smaller modal width on Scan page */
.scan-page .modal {
  width: min(400px, 90%);
}
`;
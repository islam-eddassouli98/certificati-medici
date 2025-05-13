import React, { useState, CSSProperties } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { jsPDF } from 'jspdf';

// Helper to safely create a Date object from string, defaulting to now if invalid/empty for calculation
const safeNewDate = (dateString?: string | null): Date => {
  if (dateString) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  // Fallback for calculations if date is invalid or not set, 
  // though for expiry, it should ideally depend on a valid cert date.
  return new Date(); 
};

export default function CertificateGenerator() {
  const [formData, setFormData] = useState({
    cognome: "",
    nome: "",
    cittaNascita: "",
    dataNascita: "", // Store as yyyy-MM-dd string
    residenza: "",
    documento: "",
    dataCertificato: "2025-05-13", // Store as yyyy-MM-dd string, matching template
  });

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateExpiryDate = (dateString: string): Date => {
    const startDate = safeNewDate(dateString);
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    return expiryDate;
  };

  const generateCertificate = async () => {
    setLoading(true);
    setImageUrl(null); // Reset previous image

    // Ensure date strings are valid before sending, or handle defaults
    const payload = {
      ...formData,
      sport: "Calcio", // Example data, keep as is
      sport2: "Calcio.5Q17",
      sport3: "Calcio.5Q17",
      validita: "1 anno",
      // API expects yyyy-MM-dd
      scadenza: formData.dataCertificato ? format(calculateExpiryDate(formData.dataCertificato), "yyyy-MM-dd") : "",
      dataNascita: formData.dataNascita, 
      dataCertificato: formData.dataCertificato,
    };
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    try {
      const res = await fetch(`${apiUrl}/generate`, { // Ensure this endpoint is correct
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Errore durante la generazione: ${res.statusText}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (error) {
      console.error("Errore nella generazione del certificato:", error);
      alert(`Errore nella generazione del certificato: ${error instanceof Error ? error.message : "Errore sconosciuto"}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificateAsPng = (): void => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `certificato_${formData.cognome}_${formData.nome}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(imageUrl); // Clean up blob URL if not needed immediately after
  };

  const downloadCertificateAsPdf = (): void => {
    if (!imageUrl) return;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const img = new Image();
    img.src = imageUrl;
    
    img.onload = (): void => {
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = img.width;
      const imgHeight = img.height;
      
      const finalWidth = pageWidth;
      const finalHeight = (imgHeight / imgWidth) * finalWidth;
      
      pdf.addImage(img, 'PNG', 0, 0, finalWidth, finalHeight);
      
      if (finalHeight > pageHeight) {
        pdf.addPage();
        pdf.addImage(img, 'PNG', 0, -pageHeight, finalWidth, finalHeight);
      }
      
      pdf.save(`certificato_${formData.cognome}_${formData.nome}.pdf`);
       // Clean up blob URL if PNG download isn't also needed, 
       // or manage its lifecycle if both buttons are active.
       // URL.revokeObjectURL(imageUrl); 
       // setImageUrl(null); // Optionally clear image after download
    };
    img.onerror = () => {
        alert("Errore caricamento immagine per PDF.");
    }
  };

  // Styles (CSS-in-JS)
  const styles: { [key: string]: CSSProperties } = {
    pageContainer: {
      background: "linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)", // Light lavender/blueish background
      minHeight: "100vh",
      padding: "20px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center", // Align to top to see scroll with long content
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      flexFlow: "column"
    },
    certificateGeneratorCard: {
      width: "100%",
      maxWidth: "700px",
      background: "#fff", // Form area background
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      overflow: "hidden", // Ensures header gradient respects border radius
      margin: "20px 0", // Margin top/bottom for scroll
    },
    generatorHeader: {
      background: "linear-gradient(to right, #6a11cb 0%, #2575fc 100%)", // Purple to blue gradient
      color: "#fff",
      padding: "24px",
      textAlign: "center",
    },
    headerTitle: {
      margin: "0 0 8px 0",
      fontSize: "28px",
      fontWeight: 600,
    },
    headerSubtitle: {
      margin: 0,
      fontSize: "16px",
      opacity: 0.9,
    },
    formContainer: {
      padding: "24px",
    },
    formRow: {
      display: "flex",
      flexWrap: "wrap", // Allows items to wrap on smaller screens
      gap: "16px",
      marginBottom: "20px",
    },
    formGroup: {
      flex: "1 1 calc(50% - 8px)", // Default for two items per row (minus half gap)
      display: "flex",
      flexDirection: "column",
      minWidth: "200px", // Minimum width before stacking/wrapping
    },
    formGroupFullWidth: {
      flexBasis: "100%", // Takes full width
    },
    label: {
      marginBottom: "6px",
      fontSize: "14px",
      fontWeight: 600,
      color: "#333",
    },
    input: {
      padding: "10px 12px",
      fontSize: "16px",
      border: "1px solid #ccc",
      borderRadius: "6px",
      boxSizing: "border-box",
      width: "100%",
      transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    },
    // inputFocus: { // Would need onFocus/onBlur to apply dynamically or use :focus in CSS
    //   borderColor: "#2575fc",
    //   boxShadow: "0 0 0 2px rgba(37, 117, 252, 0.2)",
    // },
    inputDisabled: {
      backgroundColor: "#f0f0f0",
      color: "#666",
      cursor: "not-allowed",
    },
    dateInputContainer: { // If custom icon styling were needed
        position: "relative",
        width: "100%",
    },
    // Calendar icon might be styled by browser for input type=date
    // If custom icon, it would go here or as pseudo-element on input.
    formActions: {
      display: "flex",
      gap: "16px",
      marginTop: "24px",
      flexWrap: "wrap", // Buttons can wrap on small screens
    },
    button: {
      padding: "12px 20px",
      fontSize: "16px",
      fontWeight: 600,
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "background-color 0.2s ease, opacity 0.2s ease",
      flex: "1", // Make buttons share space or stack
      minWidth: "150px", // Min width for buttons before stacking
    },
    buttonPrimary: {
      background: "linear-gradient(to right, #6a11cb 0%, #2575fc 100%)",
      color: "#fff",
    },
    // buttonPrimaryHover: { background: "linear-gradient(to right, #570d9e 0%, #1e5fca 100%)" },
    buttonSecondary: {
      backgroundColor: "#fff",
      color: "#2575fc",
      border: "2px solid #2575fc",
    },
    // buttonSecondaryHover: { backgroundColor: "#f0f5ff" },
    buttonDisabled: {
      opacity: 0.6,
      cursor: "not-allowed",
    },
    imagePreviewContainer: {
      marginTop: "24px",
      padding: "16px",
      border: "1px dashed #ccc",
      borderRadius: "8px",
      textAlign: "center",
      background: "#fff", // Give it a background to stand out from page bg
      flexFlow: "column"
    },
    generatedImage: {
      maxWidth: "100%",
      maxHeight: "400px", // Limit preview height
      border: "1px solid #eee",
      borderRadius: "4px",
      marginBottom: "16px",
    },
    downloadPngButton: { // Specific style for the additional PNG button
        padding: "10px 15px",
        fontSize: "14px",
        backgroundColor: "#28a745", // Green for variety
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    }
  };
  
  // Apply responsive styles dynamically (simplified for JS)
  // For more complex scenarios, consider CSS Modules or styled-components with media query helpers.
  const mediaQuerySmallScreen = typeof window !== 'undefined' && window.matchMedia("(max-width: 768px)").matches;

  if (mediaQuerySmallScreen) {
    styles.formRow = { // Override for small screens
        ...styles.formRow,
        flexDirection: 'column',
        gap: '0px', // Individual groups will have margin bottom
    };
    styles.formGroup = { // Override for small screens
        ...styles.formGroup,
        flexBasis: '100%', // Each group takes full width
        marginBottom: '20px', // Space between stacked groups
    };
    styles.formGroupLastInRow = { // If a group was last and needs no bottom margin
        ...styles.formGroup,
        marginBottom: '0px',
    };
  }


  return (
    <div style={styles.pageContainer}>
      <div style={styles.certificateGeneratorCard}>
        <header style={styles.generatorHeader}>
          <h1 style={styles.headerTitle}>Generatore Certificato</h1>
          <p style={styles.headerSubtitle}>Compila il modulo per generare il tuo certificato</p>
        </header>

        <main style={styles.formContainer}>
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Row 1: Cognome, Nome */}
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label htmlFor="cognome" style={styles.label}>Cognome</label>
                <input
                  style={styles.input}
                  type="text"
                  id="cognome"
                  name="cognome"
                  placeholder="Inserisci il cognome"
                  value={formData.cognome}
                  onChange={handleInputChange}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="nome" style={styles.label}>Nome</label>
                <input
                  style={styles.input}
                  type="text"
                  id="nome"
                  name="nome"
                  placeholder="Inserisci il nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Row 2: Città di nascita */}
            <div style={styles.formRow}>
              <div style={{...styles.formGroup, ...styles.formGroupFullWidth}}>
                <label htmlFor="cittaNascita" style={styles.label}>Città di nascita</label>
                <input
                  style={styles.input}
                  type="text"
                  id="cittaNascita"
                  name="cittaNascita"
                  placeholder="Inserisci la città di nascita"
                  value={formData.cittaNascita}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Row 3: Data di nascita, Residenza */}
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label htmlFor="dataNascita" style={styles.label}>Data di nascita</label>
                <div style={styles.dateInputContainer}>
                    <input
                    style={styles.input}
                    type="date"
                    id="dataNascita"
                    name="dataNascita"
                    value={formData.dataNascita} // yyyy-MM-dd
                    onChange={handleInputChange}
                    />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="residenza" style={styles.label}>Residenza</label>
                <input
                  style={styles.input}
                  type="text"
                  id="residenza"
                  name="residenza"
                  placeholder="Inserisci la residenza"
                  value={formData.residenza}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Row 4: Documento */}
            <div style={styles.formRow}>
              <div style={{...styles.formGroup, ...styles.formGroupFullWidth}}>
                <label htmlFor="documento" style={styles.label}>Documento</label>
                <input
                  style={styles.input}
                  type="text"
                  id="documento"
                  name="documento"
                  placeholder="Inserisci il numero del documento"
                  value={formData.documento}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Row 5: Data Certificato, Scadenza (auto) */}
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label htmlFor="dataCertificato" style={styles.label}>Data Certificato</label>
                 <div style={styles.dateInputContainer}>
                    <input
                        style={styles.input}
                        type="date"
                        id="dataCertificato"
                        name="dataCertificato"
                        value={formData.dataCertificato} // yyyy-MM-dd
                        onChange={handleInputChange}
                    />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="scadenza" style={styles.label}>Scadenza (auto)</label>
                <input
                  style={{...styles.input, ...styles.inputDisabled}}
                  type="text"
                  id="scadenza"
                  value={formData.dataCertificato ? format(calculateExpiryDate(formData.dataCertificato), "dd/MM/yyyy", { locale: it }) : ""}
                  disabled
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={styles.formActions}>
              <button
                type="button"
                onClick={generateCertificate}
                style={{
                    ...styles.button, 
                    ...styles.buttonPrimary, 
                    ...(loading ? styles.buttonDisabled : {})
                }}
                disabled={loading}
              >
                {loading ? "Generazione..." : "Genera Certificato"}
              </button>
              <button
                type="button"
                onClick={downloadCertificateAsPdf}
                style={{
                    ...styles.button, 
                    ...styles.buttonSecondary, 
                    ...(!imageUrl ? styles.buttonDisabled : {})
                }}
                disabled={!imageUrl || loading}
              >
                Scarica Certificato PDF
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* Image preview and PNG download section (kept from original logic) */}
      {imageUrl && !loading && (
        <div style={{...styles.certificateGeneratorCard, marginTop: '20px'}}> 
            <div style={styles.imagePreviewContainer}>
            <h3 style={{marginTop: 0, marginBottom: '16px', color: '#333'}}>Anteprima Certificato</h3>
            <img src={imageUrl} alt="Certificato generato" style={styles.generatedImage} />
            <div>
                <button 
                    onClick={downloadCertificateAsPng} 
                    style={styles.downloadPngButton}
                >
                Scarica come PNG
                </button>
            </div>
            </div>
        </div>
      )}
    </div>
  );
}
import jsPDF from 'jspdf';

interface HealthReportData {
  pet_name?: string;
  species?: string;
  breed?: string;
  age?: number;
  weight?: number;
  generated_at: string;
  health_score: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  trend?: 'improving' | 'stable' | 'declining';
  urgency?: string;
  vital_signs?: {
    heart_rate: number;
    temperature: number;
    activity_level: string;
    recorded_at: string;
  };
  weather?: {
    temperature: number | string;
    humidity: number | string;
    condition: string;
    impact_score?: number;
  };
  issues: string[];
  recommendations: string[];
  next_steps: string[];
}

export function generateHealthReportPDF(report: HealthReportData, petName: string): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  
  const addTitle = (text: string): void => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(47, 68, 84);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += 10;
  };
  
  const addSection = (title: string): void => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(218, 123, 147);
    doc.text(title, 15, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(46, 21, 27);
  };
  
  const addLine = (label: string, value: string): void => {
    doc.text(`${label}:`, 20, y);
    doc.text(value, 80, y);
    y += 5;
  };
  
  const addBullet = (text: string): void => {
    const lines = doc.splitTextToSize(`• ${text}`, pageWidth - 30);
    doc.text(lines, 20, y);
    y += lines.length * 5;
  };
  
  const checkNewPage = (): void => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  };
  
  // HEADER
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(47, 68, 84);
  doc.text('PawHealth', pageWidth / 2, y, { align: 'center' });
  y += 8;
  
  doc.setFontSize(14);
  doc.setTextColor(218, 123, 147);
  doc.text('Comprehensive Health Report', pageWidth / 2, y, { align: 'center' });
  y += 12;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(47, 68, 84);
  doc.text(`${petName}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date(report.generated_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}`, pageWidth / 2, y, { align: 'center' });
  y += 12;
  
  doc.setDrawColor(218, 123, 147);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;
  
  // PET INFORMATION
  checkNewPage();
  addSection('📋 PET INFORMATION');
  addLine('Name', report.pet_name || 'N/A');
  addLine('Species', report.species || 'N/A');
  addLine('Breed', report.breed || 'N/A');
  addLine('Age', `${report.age || 'N/A'} years`);
  addLine('Weight', `${report.weight || 'N/A'} kg`);
  y += 5;
  
  // HEALTH ASSESSMENT
  checkNewPage();
  addSection('📊 HEALTH ASSESSMENT');
  
  const score = report.health_score;
  doc.setFontSize(11);
  doc.text(`Health Score: ${score}/100`, 20, y);
  y += 6;
  
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(20, y, 100, 8, 2, 2, 'F');
  
  const barColor: [number, number, number] = score >= 80 ? [16, 185, 129] : score >= 60 ? [245, 158, 11] : [239, 68, 68];
  doc.setFillColor(barColor[0], barColor[1], barColor[2]);
  doc.roundedRect(20, y, score, 8, 2, 2, 'F');
  y += 12;
  
  addLine('Status', report.status || 'N/A');
  addLine('Risk Level', (report.risk_level || 'N/A').toUpperCase());
  addLine('Trend', (report.trend || 'N/A').toUpperCase());
  addLine('Urgency', report.urgency || 'N/A');
  y += 5;
  
  // VITAL SIGNS
  checkNewPage();
  addSection('📡 VITAL SIGNS');
  if (report.vital_signs) {
    addLine('Heart Rate', `${report.vital_signs.heart_rate} BPM`);
    addLine('Temperature', `${report.vital_signs.temperature}°C`);
    addLine('Activity Level', report.vital_signs.activity_level?.toUpperCase() || 'N/A');
    addLine('Recorded At', new Date(report.vital_signs.recorded_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
  }
  y += 5;
  
  // WEATHER CONDITIONS
  checkNewPage();
  addSection('🌤️ ENVIRONMENTAL CONDITIONS');
  if (report.weather) {
    addLine('Temperature', `${report.weather.temperature}°C`);
    addLine('Humidity', `${report.weather.humidity}%`);
    addLine('Condition', report.weather.condition || 'N/A');
  }
  y += 5;
  
  // DETECTED ISSUES
  checkNewPage();
  addSection('⚠️ DETECTED ISSUES');
  if (report.issues && report.issues.length > 0) {
    report.issues.forEach((issue: string) => {
      addBullet(issue);
      checkNewPage();
    });
  } else {
    addBullet('No major health issues detected');
  }
  y += 5;
  
  // RECOMMENDATIONS
  checkNewPage();
  addSection('💡 RECOMMENDATIONS');
  if (report.recommendations && report.recommendations.length > 0) {
    report.recommendations.forEach((rec: string) => {
      addBullet(rec);
      checkNewPage();
    });
  }
  y += 5;
  
  // NEXT STEPS
  checkNewPage();
  addSection('✅ NEXT STEPS');
  if (report.next_steps && report.next_steps.length > 0) {
    report.next_steps.forEach((step: string) => {
      addBullet(step);
      checkNewPage();
    });
  }
  y += 10;
  
  // FOOTER
  doc.setDrawColor(218, 123, 147);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('PawHealth Association - Smart Animal System', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('pawhealthassociation@gmail.com', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('This report is AI-generated. Consult a veterinarian for professional diagnosis.', pageWidth / 2, y, { align: 'center' });
  
  const fileName = `PawHealth_Report_${petName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, startDate, endDate, reportData } = await request.json();

    if (!email || !reportData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Generate CSV attachment
    let csvContent = 'METRIC,VALUE\n';
    csvContent += `Total Revenue,LKR ${reportData.summary.totalRevenue.toLocaleString()}\n`;
    csvContent += `Total Users,${reportData.summary.totalUsers}\n`;
    csvContent += `New Users,${reportData.summary.newUsers}\n`;
    csvContent += `Total Pets,${reportData.summary.totalPets}\n`;
    csvContent += `Active Subscriptions,${reportData.summary.activeSubscriptions}\n`;
    csvContent += `Churn Rate,${reportData.summary.churnRate}%\n`;
    csvContent += `Avg Revenue Per User,LKR ${reportData.summary.avgRevenuePerUser.toLocaleString()}\n`;
    csvContent += `Conversion Rate,${reportData.summary.conversionRate}%\n`;

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2F4454, #DA7B93); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .metric-card { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .metric-label { color: #666; font-size: 14px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #2F4454; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-success { background: #10b981; color: white; }
          .badge-warning { background: #f59e0b; color: white; }
          .badge-danger { background: #ef4444; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐾 Smart Animal System</h1>
            <h2>Analytics Report</h2>
            <p>${startDate} to ${endDate}</p>
          </div>
          
          <div class="content">
            <h3> Executive Summary</h3>
            
            <div class="metric-card">
              <div class="metric-label">Total Revenue</div>
              <div class="metric-value">LKR ${reportData.summary.totalRevenue.toLocaleString()}</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Total Users</div>
              <div class="metric-value">${reportData.summary.totalUsers}</div>
              <div style="font-size: 14px; color: #10b981;">+${reportData.summary.newUsers} new this period</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Active Subscriptions</div>
              <div class="metric-value">${reportData.summary.activeSubscriptions}</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Churn Rate</div>
              <div class="metric-value">
                ${reportData.summary.churnRate}%
                <span class="badge ${reportData.summary.churnRate < 5 ? 'badge-success' : reportData.summary.churnRate < 10 ? 'badge-warning' : 'badge-danger'}" style="margin-left: 10px;">
                  ${reportData.summary.churnRate < 5 ? 'Excellent' : reportData.summary.churnRate < 10 ? 'Good' : 'Needs Attention'}
                </span>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Avg Revenue Per User</div>
              <div class="metric-value">LKR ${reportData.summary.avgRevenuePerUser.toLocaleString()}</div>
            </div>
            
            <h3 style="margin-top: 30px;">📈 Plan Distribution</h3>
            ${reportData.planDistribution.map((plan: { name: string; value: number }) => `
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                <span>${plan.name}</span>
                <span style="font-weight: bold;">${plan.value} users</span>
              </div>
            `).join('')}
            
            <h3 style="margin-top: 30px;">🏆 Top Spending Users</h3>
            ${reportData.topSpendingUsers.slice(0, 5).map((user: { email: string; totalSpent: number }, idx: number) => `
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                <span>${idx + 1}. ${user.email}</span>
                <span style="font-weight: bold; color: #10b981;">LKR ${user.totalSpent.toLocaleString()}</span>
              </div>
            `).join('')}
            
            <div class="footer">
              <p>This report was automatically generated by Smart Animal System</p>
              <p>© ${new Date().getFullYear()} PawHealth Association. All rights reserved.</p>
              <p>📧 pawhealthassociation@gmail.com</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Smart Animal System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: ` Analytics Report: ${startDate} to ${endDate}`,
      html: emailHtml,
      attachments: [
        {
          filename: `report_${startDate}_to_${endDate}.csv`,
          content: csvContent,
        },
      ],
    });

    console.log('Email sent:', info.messageId);

    return NextResponse.json({ 
      success: true, 
      message: 'Report sent successfully',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ 
      error: 'Failed to send email report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
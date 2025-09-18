#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Get current timestamp and commit info
const timestamp = new Date().toISOString();
const commitHash = process.env.GITHUB_SHA || 'local-development';
const branch = process.env.GITHUB_REF_NAME || 'local';

// HTML template for the reports page
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Login - Test Reports</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 { 
            color: #2c3e50; 
            text-align: center; 
            margin-bottom: 40px; 
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .report-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 25px; 
            margin-bottom: 40px; 
        }
        .report-card { 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border: none;
            border-radius: 12px; 
            padding: 25px; 
            text-align: center; 
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .report-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
        }
        .report-card:hover::before {
            left: 100%;
        }
        .report-card:hover { 
            transform: translateY(-8px) scale(1.02); 
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
        }
        .report-card h3 { 
            margin: 0 0 15px 0; 
            color: #2c3e50; 
            font-size: 1.3em;
            position: relative;
            z-index: 1;
        }
        .report-card p {
            color: #5a6c7d;
            margin-bottom: 20px;
            line-height: 1.6;
            position: relative;
            z-index: 1;
        }
        .report-card a { 
            display: inline-block; 
            padding: 12px 25px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            text-decoration: none; 
            border-radius: 25px; 
            transition: all 0.3s ease;
            font-weight: 600;
            position: relative;
            z-index: 1;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.9em;
        }
        .report-card a:hover { 
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .stats { 
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            padding: 25px; 
            border-radius: 12px; 
            margin-bottom: 30px;
            border-left: 5px solid #ff6b6b;
        }
        .stats h3 { 
            margin: 0 0 15px 0; 
            color: #2c3e50; 
            font-size: 1.4em;
        }
        .stats p {
            margin: 8px 0;
            color: #5a6c7d;
            font-size: 1.1em;
        }
        .stats strong {
            color: #2c3e50;
            font-weight: 600;
        }
        .footer { 
            text-align: center; 
            color: #7f8c8d; 
            font-size: 14px; 
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
        }
        .emoji {
            font-size: 1.5em;
            margin-right: 10px;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #2ecc71;
            margin-left: 10px;
            box-shadow: 0 0 10px rgba(46, 204, 113, 0.5);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 10px rgba(46, 204, 113, 0.5); }
            50% { box-shadow: 0 0 20px rgba(46, 204, 113, 0.8); }
            100% { box-shadow: 0 0 10px rgba(46, 204, 113, 0.5); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><span class="emoji">🧪</span>API Login - Test Reports</h1>
        
        <div class="stats">
            <h3><span class="emoji">📊</span>Test Statistics <span class="status-indicator"></span></h3>
            <p>Generated on: <strong>${timestamp}</strong></p>
            <p>Commit: <strong>${commitHash}</strong></p>
            <p>Branch: <strong>${branch}</strong></p>
            <p>Environment: <strong>${process.env.NODE_ENV || 'development'}</strong></p>
        </div>
        
        <div class="report-grid">
            <div class="report-card">
                <h3><span class="emoji">📈</span>Coverage Report</h3>
                <p>Code coverage metrics with detailed line-by-line analysis. View which parts of your codebase are tested and identify areas that need more coverage.</p>
                <a href="coverage/lcov-report/index.html">View Coverage</a>
            </div>
            
            <div class="report-card">
                <h3><span class="emoji">🔬</span>Unit Tests</h3>
                <p>Individual component and function testing results. Isolated tests that verify the behavior of specific code units in controlled environments.</p>
                <a href="unit/unit-tests.html">View Unit Tests</a>
            </div>
            
            <div class="report-card">
                <h3><span class="emoji">🔗</span>Integration Tests</h3>
                <p>Component interaction and API endpoint testing. Tests that verify different parts of the system work correctly together.</p>
                <a href="integration/integration-tests.html">View Integration Tests</a>
            </div>
            
            <div class="report-card">
                <h3><span class="emoji">🎯</span>E2E Tests</h3>
                <p>End-to-end workflow and performance testing. Complete user journey tests and system performance metrics.</p>
                <a href="e2e/e2e-tests.html">View E2E Tests</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by GitHub Actions CI/CD Pipeline</strong></p>
            <p>🚀 Built with Node.js, Express, GraphQL, JWT & Mocha</p>
        </div>
    </div>
</body>
</html>
`;

// Write the HTML file
const indexPath = path.join(reportsDir, 'index.html');
fs.writeFileSync(indexPath, htmlTemplate.trim());

console.log('✅ Reports index page generated successfully!');
console.log(`📁 Location: ${indexPath}`);
console.log('🌐 Open in browser to view all test reports');

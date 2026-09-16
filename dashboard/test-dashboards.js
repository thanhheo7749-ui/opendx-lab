// ==============================================================================
// OpenDX-Lab / ShopWise
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

const jwt = require('jsonwebtoken');
const http = require('http');

const secret = '6d657461626173655f64617368626f6172645f656d6265645f7365637265745f';

function checkDashboard(dashboardId) {
  return new Promise((resolve) => {
    const token = jwt.sign({
      resource: { dashboard: dashboardId },
      params: {},
      exp: Math.round(Date.now() / 1000) + 600
    }, secret);

    const url = `http://metabase:3000/api/embed/dashboard/${token}`;
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`Dashboard ${dashboardId} Name in Metabase Response:`, json.name);
          console.log(`Dashboard ${dashboardId} Number of cards:`, json.dashcards ? json.dashcards.length : 0);
        } catch (e) {
          console.log(`Dashboard ${dashboardId} failed to parse JSON:`, data.substring(0, 100));
        }
        resolve();
      });
    }).on('error', (err) => {
      console.error(`Dashboard ${dashboardId} request failed:`, err.message);
      resolve();
    });
  });
}

async function run() {
  await checkDashboard(2);
  await checkDashboard(3);
  await checkDashboard(4);
}

run();

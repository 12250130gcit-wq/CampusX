import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true});
for(const role of ['student','gatekeeper','sso']){
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 await page.route('**/api/**',r=>r.abort());
 await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
 await page.addInitScript(role=>localStorage.setItem('campusx_session_v1',JSON.stringify({role,id:role==='student'?'STU-2024-014':role==='sso'?'ADM-SSO-001':'GK-001',name:role==='student'?'Karma Wangchuk':'Nima Dorji'})),role);
 await page.goto(`http://localhost:5173/${role}/index.html`);
 await page.locator('h2').first().waitFor();
 await page.screenshot({path:`test-results/${role}-react.png`,fullPage:true});
 await page.close();
}
await browser.close();

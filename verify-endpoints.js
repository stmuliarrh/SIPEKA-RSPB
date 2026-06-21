// Backend Endpoints Integration Verification Script
import { handler as loginHandler } from './netlify/functions/login.js';
import { handler as updatePasswordHandler } from './netlify/functions/update-password.js';
import { handler as attendanceHandler } from './netlify/functions/attendance.js';
import { handler as historyHandler } from './netlify/functions/history.js';
import { handler as leaveHandler } from './netlify/functions/leave.js';
import { getPool } from './netlify/functions/utils/db.js';

async function runTests() {
  console.log("=== STARTING INTEGRATION VERIFICATION ===\n");

  let testUser = null;

  try {
    // 1. Test Login with Seed User
    console.log("1. Testing login with default seed user...");
    const loginSeedEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        identifier: 'maulida.alb99@gmail.com',
        password: 'rspb123'
      })
    };
    const loginSeedRes = await loginHandler(loginSeedEvent, {});
    console.log(`Status Code: ${loginSeedRes.statusCode}`);
    const loginSeedBody = JSON.parse(loginSeedRes.body);
    console.log(`Response Message: ${loginSeedBody.message}`);
    if (loginSeedRes.statusCode !== 200) {
      throw new Error("Failed seed user login verification");
    }
    console.log(`✓ Seed user verified successfully. NIP: ${loginSeedBody.user.nip}, Nama: ${loginSeedBody.user.nama}\n`);

    // 2. Test Login with a brand new user (Auto-registration check)
    const randomNip = 'NIP-' + Math.floor(Math.random() * 100000);
    console.log(`2. Testing auto-registration for new employee with identifier: ${randomNip}...`);
    const registerEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        identifier: randomNip,
        password: 'rspb123'
      })
    };
    const registerRes = await loginHandler(registerEvent, {});
    console.log(`Status Code: ${registerRes.statusCode}`);
    const registerBody = JSON.parse(registerRes.body);
    console.log(`Response Message: ${registerBody.message}`);
    if (registerRes.statusCode !== 201) {
      throw new Error("Failed auto-registration verification");
    }
    testUser = registerBody.user;
    console.log(`✓ Auto-registration verified successfully. New ID: ${testUser.id}, Email: ${testUser.email}\n`);

    // 3. Test Update Password for the new user
    console.log(`3. Testing password update for the new employee...`);
    const updateEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: 'newpassword123'
      })
    };
    const updateRes = await updatePasswordHandler(updateEvent, {});
    console.log(`Status Code: ${updateRes.statusCode}`);
    const updateBody = JSON.parse(updateRes.body);
    console.log(`Response Message: ${updateBody.message}`);
    if (updateRes.statusCode !== 200) {
      throw new Error("Failed password update verification");
    }
    console.log(`✓ Password update verified successfully.\n`);

    // 4. Test Leave Submission (Sakit/Izin/Cuti) for the new user
    console.log(`4. Testing leave submission for date 2026-06-25...`);
    const leaveEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        userId: testUser.id,
        tanggal: '2026-06-25',
        status: 'Izin'
      })
    };
    const leaveRes = await leaveHandler(leaveEvent, {});
    console.log(`Status Code: ${leaveRes.statusCode}`);
    const leaveBody = JSON.parse(leaveRes.body);
    console.log(`Response Message: ${leaveBody.message}`);
    if (leaveRes.statusCode !== 200) {
      throw new Error("Failed leave submission verification");
    }
    console.log(`✓ Leave submission verified successfully.\n`);

    // 5. Test Fetch History and Statistics
    console.log(`5. Testing history and statistics retrieval for the new user...`);
    const historyEvent = {
      httpMethod: 'GET',
      queryStringParameters: {
        userId: String(testUser.id)
      }
    };
    const historyRes = await historyHandler(historyEvent, {});
    console.log(`Status Code: ${historyRes.statusCode}`);
    const historyBody = JSON.parse(historyRes.body);
    console.log(`Number of records returned: ${historyBody.records.length}`);
    console.log(`Summary Statistics:`, historyBody.summary);
    if (historyRes.statusCode !== 200 || historyBody.records.length !== 1 || historyBody.summary.izin !== 1) {
      throw new Error("Failed history retrieval verification");
    }
    console.log(`✓ History retrieval verified successfully.\n`);

    // Cleanup: Delete the newly created test user to keep DB clean
    console.log("6. Cleaning up test data from database...");
    const pool = getPool();
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    console.log("✓ Test user cleaned up successfully.\n");

    console.log("=========================================");
    console.log("  ALL BACKEND API VERIFICATIONS PASSED!  ");
    console.log("=========================================");

  } catch (err) {
    console.error("\n❌ VERIFICATION FAILED:", err.message);
    
    // Attempt cleanup if user was created
    if (testUser && testUser.id) {
      try {
        const pool = getPool();
        await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        console.log("Cleanup executed after failure.");
      } catch (cleanErr) {
        console.error("Failed to cleanup after failure:", cleanErr.message);
      }
    }
    process.exit(1);
  } finally {
    const pool = getPool();
    await pool.end();
  }
}

runTests();

import { config } from "mssql";
import { expect, test } from "vitest";
import DatabaseManager from "../../../../utils/DatabaseManager";

// In the actual code, these values would be hidden in a .env file.
// This is just for testing purposes.
const activeITSHostname = "10.28.27.236";
const activeITSAPIPort = 8009;
const testUsername = "testuser";
const testPassword = "4WsquNEjFL9O+9YgOQbqbA==";

const testMsg = `<?xml version="1.0" encoding="utf-8"?><authenticateReq xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" providerName="saa" providerType="saa"><refId>${testUsername}</refId><icdVersion>1.0</icdVersion><username>${testUsername}</username><password>${testPassword}</password></authenticateReq>`;

/*test("activeits", async () => {
  const client = new ActiveITSClient(activeITSHostname, activeITSAPIPort);
  await client.connect();
  await client.sendData(testMsg);
  const data = await client.readData();
  expect(data).toBeDefined();
  expect(data).toContain("securityToken");
});*/

const dbConfig: config = {
  user: "readonlyuser",
  password: "Caltrans2018",
  server: "10.28.27.238",
  database: "SGDB",
};

test("DatabaseManager", async () => {
  const databaseManager = DatabaseManager.getInstance();
  databaseManager.initialize(dbConfig);

  try {
    await databaseManager.connect();
    console.log("Connected to SQL Server");

    const result = await databaseManager.executeQuery(
      "SELECT USER_PASSWORD FROM CT_USER"
    );
    console.log("Query result:", result);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    // Adjust the following expectation based on your query result structure
    //expect(result[0].Result).toBe(1);
  } catch (error) {
    console.error("Error during the test:", error);
    throw error;
  } finally {
    await databaseManager.close();
    console.log("Connection closed");
  }
});

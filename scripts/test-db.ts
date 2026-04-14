import oracledb from 'oracledb';
import 'dotenv/config';

async function testConnection() {
  let connection;
  try {
    console.log('Testing Oracle Connection...');
    
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER!,
      password: process.env.ORACLE_PASSWORD!,
      connectionString: process.env.ORACLE_CONNECTION_STRING!
    });
    
    console.log('Connected!');
    
    const result = await connection.execute<[string]>(
      'SELECT table_name FROM user_tables ORDER BY table_name'
    );
    
    console.log('\ Tables:');
    result.rows?.forEach((row) => {
      console.log(`   - ${row[0]}`);
    });
    
  } catch (error) {
    console.error('Failed:', error);
  } finally {
    if (connection) await connection.close();
  }
}

testConnection();
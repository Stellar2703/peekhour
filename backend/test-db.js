// Quick database connection test
import db from './config/database.js';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...\n');
    
    // Test connection
    const [result] = await db.query('SELECT 1 + 1 AS result');
    console.log('✅ Database connection successful');
    console.log('   Query test:', result[0]);
    
    // Check tables
    const [tables] = await db.query('SHOW TABLES');
    console.log('\n📊 Tables in database:');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
    });
    
    // Check users table
    const [users] = await db.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Users: ${users[0].count}`);
    
    // Check posts table
    const [posts] = await db.query('SELECT COUNT(*) as count FROM posts');
    console.log(`📝 Posts: ${posts[0].count}`);
    
    // Check departments table
    const [depts] = await db.query('SELECT COUNT(*) as count FROM departments');
    console.log(`🏢 Departments: ${depts[0].count}`);
    
    console.log('\n✅ All integrity checks passed!');
    console.log('🚀 Backend is ready to use.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testConnection();

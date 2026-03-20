import 'dotenv/config';

async function run() {
  console.log('Starting test...');
  // Register a vendor
  const vendorRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `vendor_${Date.now()}@test.com`,
      username: `vendor_${Date.now()}`,
      password: 'password123',
      fullName: 'Test Vendor'
    })
  });
  const vendorData = await vendorRes.json();
  const vendorToken = vendorData.token;

  // Make vendor a vendor
  await fetch('http://localhost:3000/api/vendor/apply', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${vendorToken}`
    },
    body: JSON.stringify({ vendorBusinessName: 'Test Vendor Co' })
  });

  // Create market item with duration
  const itemRes = await fetch('http://localhost:3000/api/market/items', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${vendorToken}`
    },
    body: JSON.stringify({
      title: '30-Day Fitness',
      description: 'Get fit in 30 days',
      category: 'Health',
      price: 10,
      duration: 1,
      durationUnit: 'months',
      recurrence: 'daily',
      howToAchieve: JSON.stringify(['Pushups', 'Situps'])
    })
  });
  const itemData = await itemRes.json();
  const itemId = itemData.id;

  console.log('Created item:', itemId);

  // Register a buyer
  const buyerRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `buyer_${Date.now()}@test.com`,
      username: `buyer_${Date.now()}`,
      password: 'password123',
      fullName: 'Test Buyer'
    })
  });
  const buyerData = await buyerRes.json();
  const buyerToken = buyerData.token;

  // Purchase item
  const purchaseRes = await fetch(`http://localhost:3000/api/market/${itemId}/purchase`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`
    },
    body: JSON.stringify({ dreamType: 'personal' })
  });
  const purchaseData = await purchaseRes.json();
  console.log('Purchase res:', purchaseData);

  // Verify dream created
  const dreamsRes = await fetch('http://localhost:3000/api/dreams', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${buyerToken}` }
  });
  const dreamsData = await dreamsRes.json();
  const purchasedDream = dreamsData.find((d: any) => d.title === '30-Day Fitness');
  console.log('Purchased dream:', purchasedDream?.id);

  // Verify tasks
  if (purchasedDream) {
    const tasksRes = await fetch(`http://localhost:3000/api/dreams/${purchasedDream.id}/tasks`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    const tasksData = await tasksRes.json();
    console.log(`Generated ${tasksData?.length} tasks! First task date: ${tasksData[0]?.dueDate}`);
  }

  console.log('Done.');
  process.exit(0);
}

run().catch(console.error);

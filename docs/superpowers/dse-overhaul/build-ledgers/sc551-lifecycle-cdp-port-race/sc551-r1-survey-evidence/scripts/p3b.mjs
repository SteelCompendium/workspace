const getPort = (await import(process.argv[2])).default;
const a = []; for (let i = 0; i < 20; i++) a.push(await getPort());
console.log(a.join(' '));
const b = await Promise.all(Array.from({ length: 4 }, () => getPort()));
console.log('4 concurrent:', b.join(' '));
process.exit(0);

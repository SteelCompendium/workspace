export async function resolve(specifier, context, next) {
	if (specifier === 'get-port') return { url: new URL('./fake-get-port.mjs', import.meta.url).href, shortCircuit: true };
	return next(specifier, context);
}

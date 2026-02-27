// "cout" in JavaScript is usually one of these:
// 1) console.log(...)  -> shows in DevTools Console
// 2) alert(...)        -> popup message
// 3) write into HTML   -> show on the page

// 1) Console output (most common)
console.log('Hello, world!');

// 2) Popup (uncomment to use)
// alert('Hello, world!');

// 3) Show on the page (requires an element with id="output")
// NOTE: `document` only exists in a browser (DOM). If you run this file with Node.js
// (e.g., `node testjs.js`), there is no DOM, so `document` is undefined.
if (typeof document !== 'undefined') {
//     In a browser, document is a built-in object representing the HTML page (the DOM).
// In Node.js, there is no HTML page, so document is not provided.


    //this code is to check whether this file can run in two different environment
	const outputEl = document.getElementById('output');

	if (outputEl) {
		outputEl.textContent = 'Hello, world!';
	} else {
		console.warn('No element with id="output" found in the HTML.');
	}
} else {
	// Running in Node.js: there is no page to write into.
	// Use console.log instead (already done above).
}



const foo = ()=>{console.log('trigerred foo');}

console.log('this');
console.log(this);
console.log('window');
console.log(window);
console.log(`window===this? ${window===this}`);

window.wind_foo=foo;
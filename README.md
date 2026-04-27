# Syringe
String injection thingy

## Installation
```sh
git clone https://github.com/skylvie/syringe
cd syringe
pnpm i
pnpm build
pnpm link --global
```

## Usage
```sh
syringe -i ./input.js -o ./out.js -s ./data/
```

## How It Works
Lets say `input.js` contains:
```js
const a = "/* @SYRINGE-INJECT: test.txt */";
```
Inside of `data/` there is a filed called `text.txt` that contains:
```
hello
world
```
`out.js` will look like:
```js
const a = "hello\nworld";
```

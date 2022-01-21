# josh's old demo

`jq` has the live jq tool. `synonyms` has the demo that uses it. `rpc-lib` has a library they share so that `synonyms` can call out to `jq`.

How to get this running:

1. Run `yarn` in `jq` to install dependencies. Run `yarn dev` to start the dev server, which bundles and live-serves the source.
2. Do #1 again, but for `synonyms`.

You should now be able to pull off a demo like Josh showed in that video (https://www.youtube.com/watch?v=TqFuZLzLZfc).

Note: You didn't have to do anything with `rpc-lib`, because `jq` and `synonyms` both include a pre-built version of it. (Such is life.) If you want to change it, go into `rpc-lib` and run `tsc`. You'll get a built `.js` in a `build` folder, which you can copy into the appropriate places in `jq` and `synonyms`.
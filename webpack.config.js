module.exports = {
    //...
    output: {
      filename: '[name]-bundle.js',
      library: 'library-[name]',
      libraryTarget: 'commonjs',
      devtoolNamespace: 'library-[name]', // Sets a unique namespace for each library
    },
  };
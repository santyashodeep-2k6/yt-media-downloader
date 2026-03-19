const ytdl = require('@distube/ytdl-core');
ytdl.getInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  .then(info => console.log('Formats found:', info.formats.length))
  .catch(console.error);

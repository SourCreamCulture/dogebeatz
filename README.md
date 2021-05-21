# dogebeatz 
<a href="https://dogehouse.tv/u/dogebeatz">
  <img align="left" alt="dogebeatz | dogehouse" width="100px" src="https://raw.githubusercontent.com/benawad/dogehouse/staging/.redesign-assets/dogehouse_logo.svg" />
</a>

<br>

A Music bot I am creating for dogehouse!

Contributors are welcome!

For ideas of what to add to the bot create an issue.

## Contributing	

Thanks for considering to contribute! here's how to set up your environment:

1. fork this repo then clone it
2. run `npm install` to install dependencies
3. copy `config.example.js` to `config.js`. in linux or mac: `cp config.example.js config.js`;
4. [get your access & refresh tokens](https://moonstone.folf.party/#/main/main/general/tokens) then put them in `config.js`
5. run `npm run create` and save token you get, then put it in `config.js` under `botToken`;
6. go to [textdb.dev](https://textdb.dev) and copy the UUID (long text in cyan), and place it `config.js` in `dbId`.
7. run `npm run start` to start the bot!
8. open the room and use `-myid` then add it to `config.js`

### Features to be added:

- [x] queue
- [x] nowplaying
- [x] skip
- [ ] save playlists
- [ ] dj mode
- [ ] command handler
- [ ] change room name to be the current song playing (impossible for now)


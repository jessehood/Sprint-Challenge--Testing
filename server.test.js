const mongoose = require('mongoose');
const sinon = require('sinon');
const request = require('supertest');
const server = require('./server');
const Game = require('./models');
describe('Games', () => {
  beforeAll(()=> {
    mongoose.Promise = global.Promise;
    const conn = mongoose.connect('mongodb://localhost/test');
    const db = mongoose.connection;
    db.on('error', () => console.error.bind(console, 'connection error'));
    return conn;
  });

  afterAll(done => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
    });
  });
  // declare some global variables for use of testing
  // hint - these wont be constants because you'll need to override them.
  beforeEach(() => {
    // write a beforeEach hook that will populate your test DB with data
    // each time this hook runs, you should save a document to your db
    // by saving the document you'll be able to use it in each of your `it` blocks
    const game = new Game({
      title: 'Donkey Kong',
      date: 'July 1981',
      genre: 'Platformer'
    });
    return game.save();
  });
  afterEach(() => {
    return Game.remove().exec();
  });

  // test the POST here
  describe('[POST] /api/game/create', () => {
    it('should successfully create a game', async () => {
      const gameRequest = {
        title: 'Super Mario Bros.',
        date: 'September 1985',
        genre: 'Platformer'
      }
      const response = await request(server).post('/api/game/create').send(gameRequest);
      expect(response.status).toEqual(200);
      expect(response.body.title).toBe('Super Mario Bros.');
    });
    it('should return an error with a bad request body', async () => {
      const badRequest = { title: 'Super Mario Bros' }; // no date or genre field
      const response = await request(server).post('/api/game/create').send(badRequest);
      expect(response.status).toEqual(422);
      expect(typeof response.body.error).toBe('string');
    });
  });
  // test the GET here
  describe('[GET] /api/game/get', () => {
    it('should return an array of games', async () => {
      const response = await request(server).get('/api/game/get');
      expect(response.status).toBe(200);
      expect(response.body.error).toBeUndefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].title).toBe('Donkey Kong');
    });
  });
  // test the PUT here
  describe('[PUT] /api/game/update', () => {
    it('should update the title of a game', async () => {
      const game = await Game.findOne().exec();
      expect(game.title).toBe('Donkey Kong');
      const updatedGame = {id: game._id, title: 'Donkey Kong Country'};
      const response = await request(server).put('/api/game/update').send(updatedGame);
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Donkey Kong Country');
    });
    it('should return an error with a bad request body', async () => {
      const game = await Game.findOne().exec();
      const badRequest = { id: game.id }; // no title field
      const response = await request(server).put('/api/game/update').send(badRequest);
      expect(response.status).toEqual(422);
      expect(response.body.error).toBe('Must Provide a title && Id');
    });
    it('should return an error with an invalid id', async () => {
      const badRequest = { id: 'jdfjjkbnuohu', title: 'Donkey Kong' };
      const response = await request(server).put('/api/game/update').send(badRequest);
      expect(response.status).toEqual(422);
      expect(response.body.error).toBe('Cannot find game by that id');
    });
  });
  // --- Stretch Problem ---
  // Test the DELETE here
  describe('[DELETE] /api/game/destroy/:id', () => {
    it('should delete a game if given an id in the URL params', async () => {
      const game = await Game.findOne().exec();
      const response = await request(server).delete(`/api/game/destroy/${game._id}`);
      expect(response.status).toBe(200);
      expect((await Game.findById(game._id))).toBeNull();
    });
    it('should delete a game if given an id in the request body', async () => {
      const game = await Game.findOne().exec();
      const requestBody = { id: game._id };
      const response = await request(server).delete(`/api/game/destroy/`).send(requestBody);
      expect(response.status).toBe(200);
      expect((await Game.findById(game._id))).toBeNull();
    });
    it('should return an error with an invalid id in the URL param', async () => {
      const response = await request(server).delete(`/api/game/destroy/abcdefg`);
      expect(response.status).toEqual(422);
      expect(response.body.error).toBe('Cannot find game by that id');
    });
    it('should return an error with an invalid id in the request body', async () => {
      const badRequest = { id: 'abcdefg' };
      const response = await request(server).delete(`/api/game/destroy/`).send(badRequest);
      expect(response.status).toEqual(422);
      expect(response.body.error).toBe('Cannot find game by that id');
    });
    it('should return an error if no id is specified', async () => {
      const response = await request(server).delete(`/api/game/destroy/`);
      expect(response.status).toEqual(422);
      expect(response.body.error).toBe('You need to give me an ID');
    });
  });
});
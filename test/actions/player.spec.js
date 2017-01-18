/* eslint-disable no-unused-expressions */
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import nock from 'nock';
import { expect } from 'chai';
import * as ApiUtil from '../../app/utils/ApiUtil';
import * as actions from '../../app/actions/player';
import * as types from '../../app/actions/playerTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

let sandbox;
describe('actions', () => {
  describe('player', () => {
    describe('creators', () => {
      it('setPrice should create SET_PRICE action', () => {
        const id = '123456';
        const price = { lowest: 1000, total: 3 };
        expect(actions.setPrice(id, price)).to.eql(
          { type: types.SET_PRICE, id, price }
        );
      });

      it('add should create ADD_PLAYER action', () => {
        const player = { id: '123456' };
        expect(actions.add(player)).to.eql(
          { type: types.ADD_PLAYER, player }
        );
      });

      it('remove should create REMOVE_PLAYER action', () => {
        const player = { id: '123456' };
        expect(actions.remove(player)).to.eql(
          { type: types.REMOVE_PLAYER, player }
        );
      });

      it('clear should create CLEAR_LIST action', () => {
        expect(actions.clear()).to.eql(
          { type: types.CLEAR_LIST }
        );
      });
    });
    describe('async creators', () => {
      beforeEach(() => {
        sandbox = sinon.sandbox.create();
      });
      afterEach(() => {
        sandbox.restore();
      });

      it('should dispatch SAVE_SEARCH_RESULTS when search() is completed', () => {
        // Mock search response
        const results = {
          count: 3,
          items: [
            { id: '158023' },
            { id: '202350' },
            { id: '224286' }
          ],
          page: 1,
          totalPages: 1,
          totalResults: 3,
          type: 'FUTPlayerItemList'
        };
        nock('https://www.easports.com')
          .get('/uk/fifa/ultimate-team/api/fut/item').query(true)
          .reply(200, results);

        const store = mockStore({});

        return store.dispatch(actions.search('messi'))
          .then(() => { // return of async actions
            expect(store.getActions()).to.include({ type: types.SAVE_SEARCH_RESULTS, results });
          });
      });

      it('should dispatch SET_PRICE when findPrice() is completed', async () => {
        const initialState = {
          account: {
            email: 'test@test.com',
            password: 'Password1',
            secret: 'test',
            platform: 'xone'
          },
          player: {
            search: {},
            list: {}
          },
          settings: {
            autoUpdate: true,
            buy: 90,
            sell: 100,
            bin: 110
          }
        };

        const searchStub = sandbox.stub().returns({
          auctionInfo: [{
            buyNowPrice: 1000
          }, {
            buyNowPrice: 1100
          }, {
            buyNowPrice: 1100
          }, {
            buyNowPrice: 1200
          }]
        });
        const apiStub = sandbox.stub(ApiUtil, 'getApi').returns({
          search: searchStub
        });
        const store = mockStore(initialState);

        // Dispatch with lowest already set to trigger SET_PRICE
        await store.dispatch(actions.findPrice(1234));
        expect(apiStub.calledTwice).to.eql(true);
        expect(searchStub.calledTwice).to.eql(true);
        expect(store.getActions()).to.eql([
          actions.setPrice(1234, {
            lowest: 1000,
            total: 4,
            buy: 900,
            sell: 1000,
            bin: 1100,
            updated: Date.now()
          })
        ]);
      });
    });
  });
});

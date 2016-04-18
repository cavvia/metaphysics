import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../schema';

describe('SaleArtwork type', () => {
  const SaleArtwork = schema.__get__('SaleArtwork');

  beforeEach(() => {
    const gravity = sinon.stub();

    gravity.returns(Promise.resolve({
      id: 'ed-ruscha-pearl-dust-combination-from-insects-portfolio',
      sale_id: 'los-angeles-modern-auctions-march-2015',
      highest_bid: {
        cancelled: false,
        amount_cents: 325000,
      },
      bidder_positions_count: 7,
      highest_bid_amount_cents: 325000,
      minimum_next_bid_cents: 350000,
      opening_bid_cents: 180000,
      estimate_cents: null,
      low_estimate_cents: 200000,
      high_estimate_cents: 300000,
      reserve_status: 'reserve_met',
      currency: 'EUR',
      symbol: '€',
    }));

    SaleArtwork.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    SaleArtwork.__ResetDependency__('gravity');
  });

  it('formats money correctly', () => {
    const query = `
      {
        sale_artwork(id: "54c7ed2a7261692bfa910200") {
          high_estimate {
            cents
            amount
          }
          low_estimate {
            cents
            amount
          }
          highest_bid {
            cents
            amount
          }
          current_bid {
            cents
            amount
          }
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        SaleArtwork.__get__('gravity').args[0][0]
          .should.equal('sale_artwork/54c7ed2a7261692bfa910200');

        data.should.eql({
          sale_artwork: {
            high_estimate: {
              cents: 300000,
              amount: '€3,000',
            },
            low_estimate: {
              cents: 200000,
              amount: '€2,000',
            },
            highest_bid: {
              cents: 325000,
              amount: '€3,250',
            },
            current_bid: {
              cents: 325000,
              amount: '€3,250',
            },
          },
        });
      });
  });
});
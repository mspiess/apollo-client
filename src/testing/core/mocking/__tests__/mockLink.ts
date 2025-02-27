import gql from "graphql-tag";
import { MockLink } from "../mockLink";
import { execute } from "../../../../link/core/execute";

/*
We've chosen this value as the MAXIMUM_DELAY since values that don't fit into a 32-bit signed int cause setTimeout to fire immediately
*/
const MAXIMUM_DELAY = 0x7f_ff_ff_ff;

describe("mockLink", () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  const query = gql`
    query A {
      a
    }
  `;

  it("should not require a result or error when delay equals Infinity", async () => {
    const mockLink = new MockLink([
      {
        request: {
          query,
        },
        delay: Infinity,
      },
    ]);

    const observable = execute(mockLink, { query });

    const subscription = observable.subscribe(
      () => fail("onNext was called"),
      () => fail("onError was called"),
      () => fail("onComplete was called")
    );
    jest.advanceTimersByTime(MAXIMUM_DELAY);
    subscription.unsubscribe();
  });

  it("should require result or error when delay is just large", (done) => {
    const mockLink = new MockLink([
      {
        request: {
          query,
        },
        delay: MAXIMUM_DELAY,
      },
    ]);

    execute(mockLink, { query }).subscribe(
      () => fail("onNext was called"),
      (error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toMatch(
          /^Mocked response should contain either `result`, `error` or a `delay` of `Infinity`: /
        );
        done();
      }
    );

    jest.advanceTimersByTime(MAXIMUM_DELAY);
  });
});

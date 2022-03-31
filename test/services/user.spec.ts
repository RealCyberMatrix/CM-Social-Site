import { AxiosResponse } from "axios";

import Service from "../../src/services";

describe("example 1", function () {
  it("should relove the promise", async function () {
    console.log("Hello world!!!");
    const userOrError = await Service.UserService.list(0, 2)
      .then((response: AxiosResponse) => {
        console.log(response.headers['x-total-count'])
        return [response.headers['x-total-count'], response.data]
      })
      .catch((error) => {
        console.log(error);
      })
    console.log("result: ", userOrError);
  });
});

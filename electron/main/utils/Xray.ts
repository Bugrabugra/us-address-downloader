import Xray from "x-ray";

export class Scraper {
  static readonly baseUrl =
    "https://www2.census.gov/geo/tiger/TIGER_RD18/LAYER/";
  private xRay = Xray();

  async getItems({
    pathSegment,
    regex
  }: {
    pathSegment: string;
    regex: RegExp;
  }) {
    const response = await this.xRay(Scraper.baseUrl + pathSegment, {
      data: ["td a"]
    });

    if (response.err) {
      return;
    }

    if (response.data) {
      return response.data.reduce((acc: string[], item: string) => {
        if (RegExp(regex).exec(item)) {
          acc.push(item.replace("/", ""));
        }
        return acc;
      }, []);
    }
  }
}

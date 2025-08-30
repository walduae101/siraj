export default interface Context {
  req: Request;
  cfg: {
    features: {
      paynow: { enabled: boolean; methods: string[] };
    };
  };
}

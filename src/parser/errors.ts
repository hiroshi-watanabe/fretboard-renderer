export class FretboardParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FretboardParseError";
	}
}

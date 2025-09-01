class BaseCommand {
    constructor(data) {
        this.data = data;
    }
    async execute() {
        throw new Error('execute method must be implemented');
    }
}
module.exports = BaseCommand;

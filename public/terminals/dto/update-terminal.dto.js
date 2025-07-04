"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTerminalDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_terminal_dto_1 = require("./create-terminal.dto");
class UpdateTerminalDto extends (0, mapped_types_1.PartialType)(create_terminal_dto_1.CreateTerminalDto) {
}
exports.UpdateTerminalDto = UpdateTerminalDto;
//# sourceMappingURL=update-terminal.dto.js.map
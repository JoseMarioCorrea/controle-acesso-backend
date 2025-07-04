"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteUserDto = exports.SetUserAccessScheduleDto = exports.SetUserGroupDto = exports.SetUserDeviceDto = exports.SetUserAuthenticationDto = void 0;
const class_validator_1 = require("class-validator");
class SetUserAuthenticationDto {
    user_id;
    auth_mode;
    device_id;
}
exports.SetUserAuthenticationDto = SetUserAuthenticationDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SetUserAuthenticationDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SetUserAuthenticationDto.prototype, "auth_mode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SetUserAuthenticationDto.prototype, "device_id", void 0);
class SetUserDeviceDto {
    user_id;
    device_id;
}
exports.SetUserDeviceDto = SetUserDeviceDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SetUserDeviceDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SetUserDeviceDto.prototype, "device_id", void 0);
class SetUserGroupDto {
    user_id;
    group_id;
    device_id;
}
exports.SetUserGroupDto = SetUserGroupDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SetUserGroupDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SetUserGroupDto.prototype, "group_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SetUserGroupDto.prototype, "device_id", void 0);
class SetUserAccessScheduleDto {
    user_id;
    schedule_id;
    device_id;
}
exports.SetUserAccessScheduleDto = SetUserAccessScheduleDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SetUserAccessScheduleDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SetUserAccessScheduleDto.prototype, "schedule_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SetUserAccessScheduleDto.prototype, "device_id", void 0);
class DeleteUserDto {
    user_id;
    device_id;
}
exports.DeleteUserDto = DeleteUserDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], DeleteUserDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], DeleteUserDto.prototype, "device_id", void 0);
//# sourceMappingURL=set-user.dto.js.map
export declare class SetUserAuthenticationDto {
    user_id: number;
    auth_mode: number;
    device_id?: number;
}
export declare class SetUserDeviceDto {
    user_id: number;
    device_id?: number;
}
export declare class SetUserGroupDto {
    user_id: number;
    group_id: number;
    device_id?: number;
}
export declare class SetUserAccessScheduleDto {
    user_id: number;
    schedule_id: number;
    device_id?: number;
}
export declare class DeleteUserDto {
    user_id: number;
    device_id?: number;
}

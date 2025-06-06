import {HonoApp} from "../../type";
import createDeviceUuid from "./handler/createDeviceUuid";
import logout from "./handler/logout";
import requestOtp from "./handler/requestOtp";
import verifyotp from "./handler/verifyotp";
import refreahToken from "./handler/refreahToken";

export default function authRoute(app: HonoApp) {
    createDeviceUuid(app)
    requestOtp(app)
    verifyotp(app)
    refreahToken(app)
    logout(app)
}
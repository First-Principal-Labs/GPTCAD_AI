"""Persistent settings for CHATCAD addon using FreeCAD's parameter system."""

import FreeCAD

_PARAM_GROUP = "User parameter:BaseApp/Preferences/Mod/CHATCAD"


def _get_param():
    return FreeCAD.ParamGet(_PARAM_GROUP)


def get_base_url() -> str:
    return _get_param().GetString("BaseUrl", "https://api.openai.com/v1")


def set_base_url(url: str):
    _get_param().SetString("BaseUrl", url)


def get_model() -> str:
    return _get_param().GetString("Model", "gpt-4")


def set_model(model: str):
    _get_param().SetString("Model", model)


def get_api_key() -> str:
    return _get_param().GetString("ApiKey", "")


def set_api_key(key: str):
    _get_param().SetString("ApiKey", key)


def get_temperature() -> float:
    return _get_param().GetFloat("Temperature", 0.2)


def set_temperature(temp: float):
    _get_param().SetFloat("Temperature", temp)

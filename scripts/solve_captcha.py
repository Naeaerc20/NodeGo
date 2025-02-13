import sys
from twocaptcha import TwoCaptcha

api_key = 'SET_2CAPTCHA_API_HERE'
solver = TwoCaptcha(api_key)

try:
    result = solver.turnstile(
        sitekey='0x4AAAAAAA4zgfgCoYChIZf4',
        url='https://app.nodego.ai/register',
    )
except Exception as e:
    print("Error:", str(e))
    sys.exit(1)
else:
    print("solved: " + str(result))
    sys.exit(0)

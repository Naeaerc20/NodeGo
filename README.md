# NODEGO

## Requirements

1. **2CAPTCHA API & 922 Proxies**

   - **2CAPTCHA:**  
     Register an account on [2CAPTCHA](https://2captcha.com/enterpage) and obtain your API key.  
     ![2CAPTCHA Screenshot](https://prnt.sc/WVazuVGHK2Pm)  
     Make sure to top up your account with $2 or $3 since each captcha solution costs around $0.01.  
     Insert your API_KEY in the file `scripts/solve_captcha.py` (for example, using `nano scripts/solve_captcha.py`).  
     Example:  
     ![API_KEY Example](https://prnt.sc/jpcWeEfXiNGj)

   - **922 Proxies:**  
     Register an account on 922 and obtain proxies from the [Long Acting Traffic Dashboard](https://center.922proxy.com/Dashboard/LongActingTraffic).  
     Configure them with the format `username:password@hostname:port` and set the IP duration to 1440 minutes (24 hours).  
     It is recommended to generate at least 300 proxies and insert them into a file (e.g., `922_proxies.txt`).

     Example:  
     ![922 Proxies Example](https://prnt.sc/aS2rqJvjy7nU)

2. **Usage Instructions**

   - Read the instructions in `help.txt` (use the command `cat help.txt`) to learn about all available commands and their functions.

3. **Getting Started**

   - Generate your user-agents for anti-sybil prevention and insert them into `helpers/agents.txt`.
   - Convert and insert your proxies into the appropriate file.
   - Add your accounts to `helpers/accounts.json`.
   - Run the script using the provided npm commands.
   - Enjoy using NODEGO!

For any questions, please contact me at:
- [t.me/Naeaex](https://t.me/Naeaex)
- [x.com/naeaexeth](https://x.com/naeaexeth)  
Or open a PR on GitHub.

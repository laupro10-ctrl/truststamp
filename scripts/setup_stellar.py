"""
Genera una cuenta Stellar Testnet y la fondea con Friendbot.
Escribe las credenciales en backend/.env
"""
import os
import sys

try:
    from stellar_sdk import Keypair
except ImportError:
    print("Instalando stellar-sdk...")
    os.system(f"{sys.executable} -m pip install stellar-sdk")
    from stellar_sdk import Keypair

try:
    import requests
except ImportError:
    print("Instalando requests...")
    os.system(f"{sys.executable} -m pip install requests")
    import requests


def main():
    kp = Keypair.random()
    print(f"Public Key:  {kp.public_key}")
    print(f"Secret Key:  {kp.secret}")

    print("\nFondeando con Friendbot...")
    r = requests.get(f"https://friendbot.stellar.org?addr={kp.public_key}")
    if r.status_code == 200:
        print("Cuenta fondeada con 10,000 XLM (testnet)")
    else:
        print(f"Error fondeando: {r.status_code} — {r.text[:200]}")
        sys.exit(1)

    env_path = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
    env_path = os.path.abspath(env_path)

    with open(env_path, "w") as f:
        f.write(f"REGISTRY_PUBLIC_KEY={kp.public_key}\n")
        f.write(f"REGISTRY_SECRET_KEY={kp.secret}\n")

    print(f"\nCredenciales guardadas en {env_path}")
    print("Ya podes ejecutar: cd backend && python app.py")


if __name__ == "__main__":
    main()

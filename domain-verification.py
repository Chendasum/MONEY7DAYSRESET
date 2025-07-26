#!/usr/bin/env python3

import socket
import ssl
import requests
import json
import time
from urllib.parse import urlparse

def check_dns_resolution(domain):
    """Check if domain resolves to an IP address"""
    try:
        ip = socket.gethostbyname(domain)
        return {"resolved": True, "ip": ip}
    except socket.gaierror as e:
        return {"resolved": False, "error": str(e)}

def check_ssl_certificate(domain):
    """Check SSL certificate status"""
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                return {
                    "ssl_valid": True,
                    "issuer": cert.get('issuer', []),
                    "subject": cert.get('subject', []),
                    "not_after": cert.get('notAfter', '')
                }
    except Exception as e:
        return {"ssl_valid": False, "error": str(e)}

def check_http_response(url):
    """Check HTTP response from domain"""
    try:
        response = requests.get(url, timeout=10, verify=False)
        return {
            "success": True,
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "content": response.text[:500]  # First 500 chars
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    domain = "7daymoneyflow.com"
    print(f"🔍 Comprehensive Domain Check: {domain}")
    print("=" * 60)
    
    # DNS Resolution Check
    print("\n📡 DNS Resolution:")
    dns_result = check_dns_resolution(domain)
    if dns_result["resolved"]:
        print(f"✅ DNS resolves to: {dns_result['ip']}")
    else:
        print(f"❌ DNS not resolving: {dns_result['error']}")
    
    # Check www subdomain
    print("\n🌐 WWW Subdomain:")
    www_dns = check_dns_resolution(f"www.{domain}")
    if www_dns["resolved"]:
        print(f"✅ www.{domain} resolves to: {www_dns['ip']}")
    else:
        print(f"❌ www.{domain} not resolving: {www_dns['error']}")
    
    # SSL Certificate Check
    print("\n🔒 SSL Certificate:")
    ssl_result = check_ssl_certificate(domain)
    if ssl_result["ssl_valid"]:
        print("✅ SSL certificate is valid")
        print(f"   Issuer: {ssl_result['issuer']}")
        print(f"   Expires: {ssl_result['not_after']}")
    else:
        print(f"❌ SSL certificate issue: {ssl_result['error']}")
    
    # HTTP Response Check
    print("\n🌍 HTTP Response Check:")
    
    # Try HTTPS first
    https_result = check_http_response(f"https://{domain}/")
    if https_result["success"]:
        print(f"✅ HTTPS response: {https_result['status_code']}")
        
        # Check if it's our bot application
        try:
            if https_result["content"]:
                content = https_result["content"]
                if "Money Flow Reset" in content:
                    print("🎉 Your bot application is live!")
                    # Try to parse JSON response
                    try:
                        data = json.loads(content)
                        if "status" in data:
                            print(f"   Status: {data['status']}")
                        if "name" in data:
                            print(f"   App: {data['name']}")
                    except json.JSONDecodeError:
                        print("   Response received but not JSON format")
                else:
                    print("⚠️  Domain connected but different application")
        except Exception as e:
            print(f"   Could not parse response: {e}")
    else:
        print(f"❌ HTTPS failed: {https_result['error']}")
        
        # Try HTTP as fallback
        print("\n🔄 Trying HTTP fallback:")
        http_result = check_http_response(f"http://{domain}/")
        if http_result["success"]:
            print(f"✅ HTTP response: {http_result['status_code']}")
        else:
            print(f"❌ HTTP also failed: {http_result['error']}")
    
    # Test specific endpoints
    print("\n🔧 Endpoint Tests:")
    endpoints = ["/health", "/api", "/ready"]
    
    for endpoint in endpoints:
        try:
            url = f"https://{domain}{endpoint}"
            response = requests.get(url, timeout=5, verify=False)
            if response.status_code == 200:
                print(f"✅ {endpoint}: OK")
            else:
                print(f"❌ {endpoint}: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: {str(e)}")
    
    print("\n" + "=" * 60)
    
    # Provide recommendations
    if not dns_result["resolved"]:
        print("\n💡 Next Steps:")
        print("1. DNS propagation may still be in progress (can take 24-48 hours)")
        print("2. Verify DNS records are correctly configured at your registrar")
        print("3. Check if your Replit deployment is running")
        print("4. Ensure custom domain is properly added in Replit deployment settings")
    elif dns_result["resolved"] and not https_result["success"]:
        print("\n💡 Next Steps:")
        print("1. Domain resolves but HTTPS not working")
        print("2. Check if Replit deployment is running")
        print("3. Verify SSL certificate setup in Replit")
        print("4. Ensure custom domain is properly connected")
    else:
        print("\n🎉 Domain appears to be working!")
        print(f"   Your bot should be accessible at: https://{domain}/")
        print(f"   Test the health endpoint: https://{domain}/health")

if __name__ == "__main__":
    main()
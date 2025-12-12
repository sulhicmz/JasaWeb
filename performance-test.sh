#!/bin/bash

echo "🚀 JasaWeb Performance Audit"
echo "============================="

# Check if server is running
if ! curl -s http://localhost:4321 > /dev/null; then
    echo "❌ Server is not running on localhost:4321"
    exit 1
fi

echo "✅ Server is running"

# Test page load time
echo "📊 Testing page load performance..."
load_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:4321)
echo "   Home page load time: ${load_time}s"

# Test key pages
pages=("/about" "/services" "/portfolio" "/contact")
for page in "${pages[@]}"; do
    load_time=$(curl -o /dev/null -s -w '%{time_total}' "http://localhost:4321$page")
    echo "   $page page load time: ${load_time}s"
done

# Check response sizes
echo "📦 Checking response sizes..."
for page in "/" "${pages[@]}"; do
    size=$(curl -s -o /dev/null -w '%{size_download}' "http://localhost:4321$page")
    echo "   $page response size: ${size} bytes"
done

# Check HTTP headers
echo "🔍 Checking HTTP headers..."
curl -s -I http://localhost:4321 | grep -E "(Cache-Control|Content-Encoding|Content-Type)"

echo ""
echo "✅ Performance audit completed!"
echo "💡 For detailed Lighthouse audit, run:"
echo "   npx lighthouse http://localhost:4321 --output html --output-path ./lighthouse-report.html"
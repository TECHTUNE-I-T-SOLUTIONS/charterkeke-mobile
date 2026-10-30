const fs = require('fs');
let c = fs.readFileSync('app/driver/ride-details.tsx', 'utf8');

// Fix 1: Replace Alert.alert proximity block with setProximityAlert
const alertBlock = [
  "        Alert.alert(",
  "          'Not at Pickup Location',",
  "          `You are currently ${distToPickupKm.toFixed(1)} km away from the passenger's pickup location. Please ensure you are near the pickup point before notifying the rider.`,",
  "          [{ text: 'OK' }]",
  "        );"
].join('\r\n');
const alertBlockLf = alertBlock.replace(/\r\n/g, '\n');
const alertReplacement = "        setProximityAlert({ visible: true, distanceKm: distToPickupKm, type: 'pickup' });";

if (c.includes(alertBlock)) {
  c = c.replace(alertBlock, alertReplacement);
  console.log('✓ Fixed Alert.alert -> setProximityAlert (CRLF)');
} else if (c.includes(alertBlockLf)) {
  c = c.replace(alertBlockLf, alertReplacement);
  console.log('✓ Fixed Alert.alert -> setProximityAlert (LF)');
} else {
  console.log('✗ Alert block not found - searching manually...');
  const idx = c.indexOf('Not at Pickup Location');
  console.log('Alert found at:', idx, '| snippet:', c.slice(idx - 20, idx + 200));
}

// Fix 2: persistLiveEta - use supabase directly
const etaApiCall = "      await apiService.updateRide(targetRideId, {\r\n        eta_minutes: Math.round(etaMinutes),\r\n      });";
const etaApiCallLf = etaApiCall.replace(/\r\n/g, '\n');
const etaCatch = "    } catch (error) {\r\n      console.log('Failed to persist live ETA for driver ride details:', error);\r\n    }";
const etaCatchLf = etaCatch.replace(/\r\n/g, '\n');

if (c.includes(etaApiCall)) {
  c = c.replace(etaApiCall, "      await supabaseService.updateRideEta(targetRideId, Math.round(etaMinutes));");
  console.log('✓ Fixed ETA API call (CRLF)');
} else if (c.includes(etaApiCallLf)) {
  c = c.replace(etaApiCallLf, "      await supabaseService.updateRideEta(targetRideId, Math.round(etaMinutes));");
  console.log('✓ Fixed ETA API call (LF)');
} else {
  console.log('✗ ETA API call not found');
}

if (c.includes(etaCatch)) {
  c = c.replace(etaCatch, "    } catch {\r\n      // ETA persist is non-critical, ignore silently\r\n    }");
} else if (c.includes(etaCatchLf)) {
  c = c.replace(etaCatchLf, "    } catch {\n      // ETA persist is non-critical, ignore silently\n    }");
}

// Fix 3: Mount ProximityAlertModal inside JSX - before final closing </View>
const mountTarget = "      </View>\n  );\n}\n\nconst styles = StyleSheet.create";
const mountTargetCrlf = "      </View>\r\n  );\r\n}\r\n\r\nconst styles = StyleSheet.create";
const modalJsx = [
  "      <ProximityAlertModal",
  "        visible={proximityAlert.visible}",
  "        distanceKm={proximityAlert.distanceKm}",
  "        type={proximityAlert.type}",
  "        onClose={() => setProximityAlert(prev => ({ ...prev, visible: false }))}",
  "      />",
].join('\n');

// Only mount if not already there
if (!c.includes('ProximityAlertModal visible={')) {
  if (c.includes(mountTargetCrlf)) {
    c = c.replace(mountTargetCrlf, modalJsx.replace(/\n/g, '\r\n') + '\r\n      </View>\r\n  );\r\n}\r\n\r\nconst styles = StyleSheet.create');
    console.log('✓ Mounted ProximityAlertModal (CRLF)');
  } else if (c.includes(mountTarget)) {
    c = c.replace(mountTarget, modalJsx + '\n      </View>\n  );\n}\n\nconst styles = StyleSheet.create');
    console.log('✓ Mounted ProximityAlertModal (LF)');
  } else {
    console.log('✗ JSX mount point not found');
  }
} else {
  console.log('ℹ ProximityAlertModal already mounted in JSX');
}

fs.writeFileSync('app/driver/ride-details.tsx', c, 'utf8');
console.log('Done.');

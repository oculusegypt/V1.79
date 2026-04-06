package com.aiservx.tawbah;

import android.graphics.Color;
import android.os.Build;
import android.view.View;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SystemBars")
public class SystemBarsPlugin extends Plugin {

  @PluginMethod
  public void setNavigationBarColor(PluginCall call) {
    final String color = call.getString("color");
    final Boolean darkIcons = call.getBoolean("darkIcons");

    if (color == null || color.trim().isEmpty()) {
      call.reject("color_required");
      return;
    }

    final int parsed;
    try {
      parsed = Color.parseColor(color);
    } catch (Exception e) {
      call.reject("invalid_color");
      return;
    }

    getActivity().runOnUiThread(() -> {
      try {
        getActivity().getWindow().setNavigationBarColor(parsed);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && darkIcons != null) {
          int vis = getActivity().getWindow().getDecorView().getSystemUiVisibility();
          if (Boolean.TRUE.equals(darkIcons)) {
            vis |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
          } else {
            vis &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
          }
          getActivity().getWindow().getDecorView().setSystemUiVisibility(vis);
        }

        call.resolve();
      } catch (Exception e) {
        call.reject("failed_to_set_navigation_bar_color");
      }
    });
  }
}

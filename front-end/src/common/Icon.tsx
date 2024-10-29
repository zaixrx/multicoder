enum IconMode {
  Dark,
  Light,
}

function Icon({ mode, name }: { mode: IconMode; name: string }) {
  function getIconPath() {
    let path = "";

    switch (mode) {
      case IconMode.Dark:
        path = "/icons/dark/" + name;
        break;
      case IconMode.Light:
        path = "/icons/dark/" + name;
        break;
    }

    return path;
  }

  return <img src={getIconPath()} />;
}

export default Icon;
